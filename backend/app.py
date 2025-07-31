from flask import Flask, Response, redirect, jsonify, json, request , url_for , abort
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np
import pickle
import os
from datetime import datetime
from models import *
from dotenv import load_dotenv
from authlib.integrations.flask_client import OAuth
from db import db
from controller import *

load_dotenv()

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

# --- Configuration ---
app = Flask(__name__)

CORS(app)
oauth = OAuth(app)

app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['API_KEY'] = os.getenv("API_KEY") 

if not app.config['API_KEY']:
    raise ValueError("API_KEY environment variable not set.")

db.init_app(app)
setup_chatbot(app)
OUTPUT_WIDTH = 1270
OUTPUT_HEIGHT = 720

# VIDEO_SOURCE = "./test_data/tree3.mp4"
VIDEO_SOURCE = 0

# Google OAuth config
oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    client_kwargs={'scope': 'openid email profile'},
)

# GitHub OAuth config
oauth.register(
    name='github',
    client_id=os.getenv('GITHUB_CLIENT_ID'),
    client_secret=os.getenv('GITHUB_CLIENT_SECRET'),
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'read:user user:email'},
)

#Google Oauth
@app.route('/login/google')
def login_oauth():
    redirect_uri = url_for('authorize', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@app.route('/authorize')
def authorize():
    token = oauth.google.authorize_access_token()
    user_info = oauth.google.get('https://www.googleapis.com/oauth2/v2/userinfo').json()
    email = user_info['email']
    name = user_info['name']

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, name=name)
        db.session.add(user)
        db.session.commit()

    jwt_token = generate_token(user)
    frontend_redirect_url = f"http://localhost:5173/login?authToken={jwt_token}"
    return redirect(frontend_redirect_url)

@app.route('/login/github')
def login_github():
    redirect_uri = url_for('authorize_github', _external=True)
    return oauth.github.authorize_redirect(redirect_uri)


@app.route('/authorize/github')
def authorize_github():
    token = oauth.github.authorize_access_token()
    user_info = oauth.github.get('user').json()
    emails_info = oauth.github.get('user/emails').json()

    email = next((e['email'] for e in emails_info if e['primary']), None)
    name = user_info.get('name') or user_info.get('login')

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, name=name)
        db.session.add(user)
        db.session.commit()

    jwt_token = generate_token(user)
    frontend_redirect_url = f"http://localhost:5173/login?authToken={jwt_token}"
    return redirect(frontend_redirect_url)


# --- Initialize MediaPipe Pose ---
mpDraw = mp.solutions.drawing_utils
mPose = mp.solutions.pose
pose = mPose.Pose()

# --- Load pre-trained model and label encoder ---
pose_model = None
label_encoder = None
available_poses = []

try:
    if os.path.exists("pose_model.pkl") and os.path.exists("label_encoder.pkl"):
        with open("pose_model.pkl", "rb") as f:
            pose_model = pickle.load(f)
        with open("label_encoder.pkl", "rb") as f:
            label_encoder = pickle.load(f)
        print("Model and label encoder loaded successfully.")
        available_poses = label_encoder.classes_.tolist()
        print(f"Available poses: {available_poses}")
    else:
        print("Model or label encoder files (.pkl) not found.")
        print("Please run pose_data.py followed by train.py to generate these files.")

except Exception as e:
    print(f"Error loading model or label encoder: {e}")
    pose_model = None
    label_encoder = None
    available_poses = []

camera = None

selected_pose_name = None
selected_pose_index = -1

last_pose_data = {
    'feedback': "Loading...",
    'score': 0,
    'pose': "N/A"
}

stop_flag = False

def release_camera():
    global camera
    if camera is not None:
        camera.release()
        camera = None
        print("Camera released")

def get_landmarks_flat(landmarks):
    return np.array([[lm.x, lm.y, lm.z] for lm in landmarks.landmark]).flatten()

def generate_video():
    global camera, OUTPUT_WIDTH, OUTPUT_HEIGHT, last_pose_data, stop_flag, selected_pose_name, selected_pose_index, label_encoder, pose_model

    while not stop_flag:
        if camera is None or not camera.isOpened():
            camera = cv2.VideoCapture(VIDEO_SOURCE)

        success, img = camera.read()
        if not success:
            if isinstance(VIDEO_SOURCE, str) and os.path.exists(VIDEO_SOURCE):
                camera.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            else:
                print("Error reading from camera/video source.")
                stop_flag = True
                break

        if img is None:
            print("Received empty frame.")
            if isinstance(VIDEO_SOURCE, str) and os.path.exists(VIDEO_SOURCE):
                camera.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            else:
                stop_flag = True
                break

        imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = pose.process(imgRGB)

        current_feedback = "No Pose Detected"
        current_score = 0
        current_pose_name_display = selected_pose_name if selected_pose_name else "N/A"

        img = cv2.resize(img, (OUTPUT_WIDTH, OUTPUT_HEIGHT))
        height, width, _ = img.shape

        if results.pose_landmarks:
            mpDraw.draw_landmarks(img, results.pose_landmarks, mPose.POSE_CONNECTIONS)

            if pose_model and label_encoder and selected_pose_name is not None and selected_pose_index != -1:
                current_landmarks_flat = get_landmarks_flat(results.pose_landmarks)
                input_data = current_landmarks_flat.reshape(1, -1)

                try:
                    probabilities = pose_model.predict_proba(input_data)
                    if selected_pose_index < len(probabilities[0]):
                        selected_pose_prob = probabilities[0][selected_pose_index]
                        current_score = selected_pose_prob * 100
                        current_pose_name_display = selected_pose_name

                        if current_score > 90:
                            current_feedback = "Well Done!!"
                        elif current_score > 85:
                            current_feedback = "Good!! Can do better!!"
                        else:
                            current_feedback = "Needs Improvement!!"
                    else:
                        current_feedback = "Internal Error: Invalid pose index."
                        current_score = 0
                        current_pose_name_display = selected_pose_name

                except Exception as e:
                    print(f"Error during model prediction: {e}")
                    current_feedback = "Prediction Error"
                    current_score = 0
                    current_pose_name_display = selected_pose_name

            elif pose_model and label_encoder and selected_pose_name is None:
                current_feedback = "Select a pose below"
                current_score = 0
                current_pose_name_display = "N/A"
            else:
                current_feedback = "Model not loaded."
                current_score = 0
                current_pose_name_display = "N/A"

        else:
            if selected_pose_name is not None:
                current_feedback = f"Looking for {selected_pose_name}..."
                current_pose_name_display = selected_pose_name
            else:
                current_feedback = "No pose detected."
                current_pose_name_display = "N/A"

        last_pose_data = {
            'feedback': current_feedback,
            'score': int(current_score),
            'pose': current_pose_name_display
        }

        cv2.putText(img, f'Selected Pose: {current_pose_name_display}', (int(width * 0.085), int(height * 0.85)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        if pose_model and label_encoder and selected_pose_name is not None and selected_pose_index != -1 and results.pose_landmarks:
            cv2.putText(img, f'Accuracy: {int(current_score)}%', (int(width * 0.085), int(height * 0.90)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)
            cv2.putText(img, current_feedback, (int(width * 0.085), int(height * 0.95)),
                        cv2.FONT_HERSHEY_SIMPLEX, 1,
                        (0, 255, 0) if current_score > 85 else (0, 0, 255), 2)
        elif selected_pose_name is None and pose_model:
            cv2.putText(img, "Please select a pose.", (int(width * 0.085), int(height * 0.90)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 165, 255), 2)
        elif not pose_model:
            cv2.putText(img, "Model not loaded. Run train.py", (int(width * 0.085), int(height * 0.90)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        _, buffer = cv2.imencode('.jpg', img)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    release_camera()
    print("Video generation stopped.")



# ---- Home Route ---
@app.route('/')
def home():
    release_camera() 
    return redirect('http://localhost:5173') 

# ---- Video Feed Routes ---
@app.route('/video_feed')
def video_feed():
    """Endpoint to stream the video feed with pose information."""
    global camera, stop_flag
    stop_flag = False 
    print("Starting video feed...")
    is_file_source = isinstance(VIDEO_SOURCE, str) and os.path.exists(VIDEO_SOURCE)
    is_webcam_source = isinstance(VIDEO_SOURCE, int)

    if camera is None or not camera.isOpened() or (is_file_source and not camera.get(cv2.CAP_PROP_POS_FRAMES) > 0): 
        camera = cv2.VideoCapture(VIDEO_SOURCE)
        if not camera.isOpened():
            print(f"Failed to open video source: {VIDEO_SOURCE}")
            return Response("Failed to open video source", status=500)
        else:
             print(f"Video source opened: {VIDEO_SOURCE}")

    return Response(generate_video(), mimetype='multipart/x-mixed-replace; boundary=frame')



# Existing stop camera route
@app.route('/stop_camera')
def stop_camera_route():
    global stop_flag
    stop_flag = True
    print("Stop camera endpoint called. Stopping video feed...")
    return "Camera stop command sent. Feed will stop shortly."


# --- New Endpoint to get available poses ---
@app.route('/available_poses', methods=['GET'])
def get_available_poses():
    if available_poses:
        return jsonify({'poses': available_poses})
    else:
        return jsonify({'message': 'Available poses not loaded. Check if model/encoder loaded correctly.'}), 500


# --- New Endpoint to select a pose ---
@app.route('/select_pose', methods=['POST'])
def select_pose_route():
    global selected_pose_name, selected_pose_index, last_pose_data
    if not pose_model or not label_encoder:
         return jsonify({'status': 'error', 'message': 'Model or label encoder not loaded.'}), 500

    data = request.get_json()
    pose_name = data.get('pose_name')
    if pose_name and pose_name in label_encoder.classes_:
        selected_pose_name = pose_name
        try:

            selected_pose_index = label_encoder.transform([pose_name])[0]
            last_pose_data = {
                'feedback': f"Looking for {selected_pose_name}...",
                'score': 0, 
                'pose': selected_pose_name 
            }
            return jsonify({'status': 'success', 'message': f'Pose "{pose_name}" selected.'})

        except Exception as e:
            print(f"Error transforming pose name to index: {e}")
            selected_pose_name = None
            selected_pose_index = -1
            last_pose_data = {
                 'feedback': "Error selecting pose.",
                 'score': 0,
                 'pose': "N/A"
            }
            return jsonify({'status': 'error', 'message': f'Error processing pose name: {pose_name}'}), 500
    else:
        selected_pose_name = None
        selected_pose_index = -1
        last_pose_data = {
             'feedback': "Invalid pose selected.",
             'score': 0,
             'pose': "N/A"
        }
        print(f"Invalid pose name received: {pose_name}")

        return jsonify({'status': 'error', 'message': f'Invalid pose name: {pose_name}'}), 400


@app.route('/pose_feedback', methods=['GET'])
def pose_feedback():
    global last_pose_data
    return jsonify(last_pose_data) 


# --- Users routes ---
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({'message': 'Please provide all required fields.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email address already exists.'}), 409

    new_user = User(name=name, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully.'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Please provide email and password.'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid email or password.'}), 401

    token = generate_token(user)
    return jsonify({'token': token}), 200

@app.route('/user', methods=['GET'])
@token_required
def get_user(current_user):
    """Endpoint to retrieve the logged-in user's information."""
    # print(f"Current User: {current_user}")
    user_data = {
        'name': current_user.name,
        'email': current_user.email,
    }
    return jsonify(user_data), 200

@app.route('/user', methods=['PUT'])
@token_required
def update_user(current_user):
    """Endpoint to update the logged-in user's information."""
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if name:
        current_user.name = name

    if email:
        existing_user_by_email = User.query.filter(User.email == email, User.id != current_user.id).first()
        if existing_user_by_email:
            return jsonify({'message': 'Email address already exists.'}), 409
        current_user.email = email
    if password:
        current_user.set_password(password)

    db.session.commit()
    return jsonify({'message': 'User information updated successfully.'}), 200

@app.route('/user', methods=['DELETE'])
@token_required
def delete_user(current_user):
    """Endpoint to delete the logged-in user's account."""
    db.session.delete(current_user)
    db.session.commit()
    return jsonify({'message': 'User account deleted successfully.'}), 200


# --- Practice Log Routes ---
@app.route('/log_practice', methods=['POST'])
@token_required
def log_practice(current_user):
    """Endpoint to record poses practiced by a user."""
    data = request.get_json()
    poses = data.get('poses')

    if not poses or not isinstance(poses, list) or not all(isinstance(pose, str) for pose in poses):
        return jsonify({'message': 'Please provide a list of pose names.'}), 400

    poses_string = ",".join(poses)
    log_entry = PracticeLog(user_id=current_user.id, poses_practiced=poses_string)
    db.session.add(log_entry)
    db.session.commit()

    return jsonify({'message': 'Practice log recorded successfully.'}), 201

@app.route('/practice_history', methods=['GET'])
@token_required
def practice_history(current_user):
    """Endpoint to retrieve the practice history of the logged-in user."""
    logs = PracticeLog.query.filter_by(user_id=current_user.id).order_by(PracticeLog.practice_date.desc()).all()
    history = []
    for log in logs:
        history.append({
            'date': log.practice_date.isoformat(),
            'poses': log.poses_practiced.split(',')
        })
    return jsonify({'practice_history': history}), 200

@app.route('/practice_log/<date>', methods=['GET'])
@token_required
def get_practice_log_by_date(current_user, date):
    """Endpoint to retrieve the practice log for a specific date."""
    try:
        practice_date = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Invalid date format. Please useenamefont-MM-DD.'}), 400

    log = PracticeLog.query.filter_by(user_id=current_user.id, practice_date=practice_date).first()
    if log:
        return jsonify({
            'date': log.practice_date.isoformat(),
            'poses': log.poses_practiced.split(',')
        }), 200
    else:
        return jsonify({'message': f'No practice log found for {practice_date}.'}), 404


# --- Yoga Recommendation Routes ---
@app.route('/yoga_recommendations', methods=['POST'])
def yoga_recommendations():
    data = request.get_json()
    height = data.get('height')
    weight = data.get('weight')
    age = data.get('age')
    goal = data.get('goal')
    experience_level = data.get('experience_level')
    health_issue = data.get('health_issue')
    bmi = data.get('bmi')

    required_fields = ['height', 'weight', 'age', 'goal', 'experience_level']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields.'}), 400

    if not isinstance(height, (int, float)) or not isinstance(weight, (int, float)) or not isinstance(age, int):
        return jsonify({'error': 'Height, weight, and age must be numeric values.'}), 400

    if bmi is not None and not isinstance(bmi, (int, float)):
        return jsonify({'error': 'BMI must be a numeric value if provided.'}), 400

    yoga_recommendation_json = generate_yoga_exercises_from_gemini(
        height=height,
        weight=weight,
        age=age,
        goal=goal,
        experience_level=experience_level,
        health_issue=health_issue,
        bmi=bmi
    )

    if isinstance(yoga_recommendation_json, Response):
        return yoga_recommendation_json
    
    else:
        try:
            raw_data = json.loads(yoga_recommendation_json)
            filtered_data = {
                "bmi": raw_data.get("bmi"),
                "bmi_category": raw_data.get("bmi_category"),
                "recommended_poses": [
                    {
                        "pose_name": pose.get("pose_name"),
                        "benefits": pose.get("benefits")
                    }
                    for pose in raw_data.get("recommended_poses", [])
                ],
                "note": raw_data.get("note")
            }
            return jsonify(filtered_data), 200
        
        except (SyntaxError, TypeError) as e:
            print(f"Error converting JSON output: {e}")
            print(f"Raw JSON output: {yoga_recommendation_json}")
            return jsonify({'error': 'Error processing JSON output.'}), 500

# --- Weekly Diet Plan Routes ---
@app.route('/weekly_diet_plan', methods=['POST'])
def weekly_diet_plan():
    data = request.get_json()
    
    height = data.get('height')
    weight = data.get('weight')
    age = data.get('age')
    gender = data.get('gender')
    diet = data.get('diet')
    activity = data.get('activityLevel')
    healthIssues = data.get('healthIssues') or "no health issues"
    goal = data.get('goal')
    bmi = data.get('bmi')  

    required_fields = ['height', 'weight', 'age', 'gender', 'diet', 'activityLevel', 'goal']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields.'}), 400

    if not isinstance(height, (int, float)) or not isinstance(weight, (int, float)) or not isinstance(age, int):
        return jsonify({'error': 'Height, weight, and age must be numeric values.'}), 400

    if diet not in ['veg', 'non-veg' , 'eggitarian']:
        return jsonify({'error': 'Diet not selected !!'}), 400

    if activity not in ['no-exercise', 'light-activity', 'moderate', 'very-active']:
        return jsonify({'error': 'Invalid activity level provided.'}), 400

    if bmi is not None and not isinstance(bmi, (int, float)):
        return jsonify({'error': 'BMI must be a numeric value if provided.'}), 400

    diet_plan_response = generate_weekly_diet_plan(height, weight, age, gender, diet, activity, goal, bmi=bmi, healthIssues=healthIssues)

    if isinstance(diet_plan_response, Response):
        return diet_plan_response
    else:
        try:
            return jsonify(eval(diet_plan_response)), 200
        
        except (SyntaxError, TypeError) as e:
            print(f"Error converting JSON output: {e}")
            print(f"Raw JSON output: {diet_plan_response}")
            return jsonify({'error': 'Error processing JSON output.'}), 500

# --- Favorites PoseRoutes --- 
@app.route("/api/favorites", methods=["POST"])
@token_required
def add_favorite_pose(current_user):
    data = request.get_json()
    pose = data.get("pose")

    if not pose:
        return jsonify({"error": "Missing pose data"}), 400

    pose_name = pose.get("display_name") or pose.get("name")
    try:
        existing_favorite = FavoritePose.query.filter_by(
            user_id=current_user.id,
            pose_name=pose_name
        ).first()

        if existing_favorite:
            return jsonify({"error": "Pose already saved to favorites"}), 409

        favorite = FavoritePose(
            user_id=current_user.id,
            pose_name=pose_name,
            pose_image=pose.get("src")
        )

        db.session.add(favorite)
        db.session.commit()
        return jsonify({"message": "Pose saved to favorites"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/favorites/<int:user_id>", methods=["GET"])
@token_required
def get_favorite_poses(current_user, user_id):
    try:
        if current_user.id != user_id:
            return jsonify({"error": "Unauthorized access"}), 403
        
        favorites = FavoritePose.query.filter_by(user_id=user_id).all()
        result = [
            {
                "id": fav.id,
                "pose_name": fav.pose_name,
                "pose_image": fav.pose_image,
                "added_on": fav.added_on.isoformat()
            }
            for fav in favorites
        ]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/favorites/<int:favorite_id>", methods=["DELETE"])
@token_required
def delete_favorite_pose(current_user, favorite_id):
    try:
        favorite = FavoritePose.query.get(favorite_id)
        if not favorite:
            return jsonify({"error": "Favorite pose not found"}), 404

        if favorite.user_id != current_user.id:
            return jsonify({"error": "Unauthorized to delete this favorite"}), 403

        db.session.delete(favorite)
        db.session.commit()
        return jsonify({"message": "Favorite pose deleted"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- Poses Ref images and videos---
@app.route('/poses', methods=['GET'])
def get_poses():
    poses = Pose.query.all()
    return jsonify([pose.to_dict() for pose in poses]), 200

# --- GET pose by name ---
@app.route('/poses/<string:pose_name>', methods=['GET'])
def get_pose_by_name(pose_name):    
    pose_name = pose_name.capitalize()
    pose = Pose.query.filter_by(pose_name=pose_name).first()
    if not pose:
        abort(404, description="Pose not found")
    return jsonify(pose.to_dict()), 200

# --- DELETE pose by name ---
@app.route('/poses/<string:pose_name>', methods=['DELETE'])
def delete_pose_by_name(pose_name):
    pose = Pose.query.filter_by(pose_name=pose_name).first()
    if not pose:
        abort(404, description="Pose not found")
    db.session.delete(pose)
    db.session.commit()
    return jsonify({'message': f'Pose \"{pose_name}\" deleted successfully'}), 200

# --- POST - Add a new pose ---
@app.route('/poses', methods=['POST'])
def add_pose():
    data = request.get_json()
    pose_name = data.get('pose_name')
    pose_image = data.get('pose_image')
    pose_link = data.get('pose_link')

    if not pose_name:
        return jsonify({'error': 'pose_name is required'}), 400

    existing_pose = Pose.query.filter_by(pose_name=pose_name).first()
    if existing_pose:
        return jsonify({'error': 'Pose with this name already exists'}), 409

    new_pose = Pose(
        pose_name=pose_name,
        pose_image=pose_image,
        pose_link=pose_link
    )
    db.session.add(new_pose)
    db.session.commit()

    return jsonify(new_pose.to_dict()), 201


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, threaded=True)