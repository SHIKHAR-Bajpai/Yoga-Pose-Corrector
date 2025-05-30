from flask import  jsonify,  request 
import jwt
from datetime import datetime, timedelta
from functools import wraps
import google.generativeai as genai
from flask import current_app
from models import *
from dotenv import load_dotenv


model = None  

def setup_chatbot(app):
    load_dotenv()
    global model
    import google.generativeai as genai
    genai.configure(api_key=app.config['API_KEY'])
    model = genai.GenerativeModel('gemini-2.0-flash')

# --- JWT Helper Functions ---
def generate_token(user):
    payload = {
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow(),
        'sub': str(user.id),
        'name': user.name,
        'email': user.email,
    }
    # print("Payload being encoded:", payload)
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
    return token if isinstance(token, str) else token.decode('utf-8')

def decode_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['sub']    
    except jwt.ExpiredSignatureError:
        return None

    except jwt.InvalidTokenError as e:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Bearer token not properly formatted.'}), 401

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            user_id = decode_token(token)
            if not user_id:
                return jsonify({'message': 'Invalid token!'}), 401
            current_user = User.query.get(user_id)
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except Exception as e:
            print("running2", e)
            return jsonify({'message': 'Invalid token!'}), 401

        return f(current_user, *args, **kwargs)
    return decorated


def generate_yoga_exercises_from_gemini(height, weight, age, goal , experience_level, health_issue=None, bmi=None):
    prompt = f"Generate yoga pose recommendations for a {age}-year-old with the goal: '{goal}'. "
    prompt += f"Their experience level is '{experience_level}'."
    if health_issue:
        prompt += f" They have the following health issue(s): '{health_issue}'. "
    prompt += f"They are {height} cm tall and weigh {weight} kg."
    if bmi:
        prompt += f" Their BMI is {bmi}."
    prompt += " Determine their BMI category (Underweight, Normal weight, Overweight, Obese)."
    prompt += " Provide a list of up to 10 recommended yoga poses suitable for their age, goal, experience level, and any mentioned health issues."
    prompt += " Include a 'note' with brief suggestions considering their age, goal, experience level, health issues (if any), and BMI category."
    prompt += " Return the response in JSON format with keys: 'bmi', 'bmi_category', 'recommended_poses', and 'note'."

    try:
        response = model.generate_content(prompt)
        if response.parts and hasattr(response.parts[0], 'text'):
            try:
                json_output = response.parts[0].text
                start_index = json_output.find('{')
                end_index = json_output.rfind('}') + 1
                if start_index != -1 and end_index > start_index:
                    return json_output[start_index:end_index]
                else:
                    return jsonify({'error': 'Could not extract valid JSON from Gemini response.'}), 500
            except Exception as e:
                print(f"Error parsing Gemini response as JSON: {e}")
                print(f"Raw Gemini response: {response.parts[0].text}")
                return jsonify({'error': 'Error parsing yoga recommendations from Gemini.'}), 500
        else:
            return jsonify({'error': 'Could not generate yoga recommendations.'}), 500
    except Exception as e:
        print(f"Error generating yoga recommendations: {e}")
        return jsonify({'error': 'Error communicating with Gemini for yoga recommendations.'}), 500

def generate_weekly_diet_plan(height, weight, age, gender, diet, activity, goal, bmi , healthIssues=None):
    prompt = f"Generate a 7-day diet plan for a {age}-year-old {gender} who is {height} cm tall and weighs {weight} kg."
    
    if bmi is not None:
        prompt += f" Their BMI is {bmi}."
        
    prompt += f" Their Health Issues are {healthIssues}."
    prompt += f" Their diet preference is {diet} and their activity level is {activity} (low, medium, or high)."
    prompt += f" Their goal is: {goal}. Please provide a 7-day diet plan in JSON format with a top-level key 'weeklyDietPlan' which is an array of 7 objects. Each object should have a 'day' (1 to 7) and a 'meals' key. The 'meals' key should be an object containing 'Breakfast', 'Snack', 'Lunch', 'Dinner', and 'Evening Snack' as keys, with their respective meal descriptions as values."
    prompt += " Ensure the JSON is well-structured and easy to parse."

    try:
        response = model.generate_content(prompt)
        if response.parts and hasattr(response.parts[0], 'text'):
            try:
                diet_plan_json = response.parts[0].text
                start_index = diet_plan_json.find('{')
                end_index = diet_plan_json.rfind('}') + 1
                if start_index != -1 and end_index > start_index:
                    return diet_plan_json[start_index:end_index]
                else:
                    return jsonify({'error': 'Could not extract valid JSON from Gemini response.'}), 500
            except Exception as e:
                print(f"Error parsing Gemini response as JSON: {e}")
                print(f"Raw Gemini response: {response.parts[0].text}")
                return jsonify({'error': 'Error parsing diet plan from Gemini.'}), 500
        else:
            return jsonify({'error': 'Could not generate diet plan.'}), 500
    except Exception as e:
        print(f"Error generating diet plan: {e}")
        return jsonify({'error': 'Error communicating with Gemini to generate diet plan.'}), 500
