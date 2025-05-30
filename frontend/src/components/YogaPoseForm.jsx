import { useState, useEffect } from "react";
import Loader from "@/components/ui/loader-one.jsx";

const HealthForm = () => {

  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    age: "",
    bmi: "",
    goal: "",
    healthIssues: "",
    experienceLevel: "",
    gender: "",
    diet: "",
    activityLevel: "",
  });

  const [formType, setFormType] = useState("yoga");
  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
  }, [formData]);

  const fetchFormData = async (endpoint, data) => {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(data), 
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}, Body: ${errorText}`
        );
      }
      const result = await response.json();
      return result;
    } catch (error) {
      setFetchError(error.message); 
      setLoading(false);
      throw error; 
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmittedData(null);
    setFetchError(null); 

    try {
      let result;
      if (formType === "yoga") {
        const yogaData = {
          height: parseInt(formData.height, 10),
          weight: parseInt(formData.weight, 10),
          age: parseInt(formData.age, 10),
          goal: formData.goal,
          healthIssues: formData.healthIssues,
          experience_level: formData.experienceLevel,
        };
        result = await fetchFormData( "http://localhost:5000/yoga_recommendations", yogaData );
        result.formType = "yoga";
      } else if (formType === "diet") {
        const dietData = {
          height: parseInt(formData.height, 10),
          weight: parseInt(formData.weight, 10),
          age: parseInt(formData.age, 10),
          bmi: parseFloat(formData.bmi) || null, 
          goal: formData.goal,
          healthIssues: formData.healthIssues,
          gender: formData.gender,
          diet: formData.diet,
          activityLevel: formData.activityLevel,
        };
        result = await fetchFormData(
          "http://localhost:5000/weekly_diet_plan",
          dietData
        );
        result.formType = "diet";
      }
      setSubmittedData(result);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-primary_bg p-10 mx-auto rounded-lg shadow-glow-soft max-w-4xl w-full">
      <div className="mb-10 text-center">
        <button
          className={`px-6 py-3 font-semibold border-2 border-accent_border transition-colors ${
            formType === "yoga"
              ? "bg-primary_accent text-primary_bg"
              : "bg-transparent text-main_text"
          }`}
          onClick={() => {
            setFormType("yoga");
            setSubmittedData(null);
            setFormData({
              ...formData,
              diet: "",
              activityLevel: "",
              experienceLevel: "beginner",
              gender: "",
            });
            setFetchError(null);
          }}
        >
          Personalized Yoga Poses
        </button>
        <button
          className={`px-6 py-3 font-semibold border-2 border-accent_border ml-4 transition-colors ${
            formType === "diet"
              ? "bg-primary_accent text-primary_bg"
              : "bg-transparent text-main_text"
          }`}
          onClick={() => {
            setFormType("diet");
            setSubmittedData(null);
            setFormData({
              ...formData,
              experienceLevel: "beginner",
              goal: "",
              gender: "",
              diet: "",
              activityLevel: "",
            });
            setFetchError(null);
          }}
        >
          Personalized Diet Plans
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <Loader />
        </div>
      ) : fetchError ? (
        <div className="mt-8 p-6 bg-red-200 border border-red-400 rounded-md shadow-md text-red-700">
          <h2 className="text-xl font-semibold mb-2">Error:</h2>
          <p>{fetchError}</p>
        </div>
      ) : submittedData ? (
        <div className="mt-8 p-6 bg-secondary_bg border border-standard_border rounded-md shadow-md text-main_text">
          <h2 className="text-center text-2xl font-bold mb-4 pb-1 font-mono border-b border-accent_border">
            Personalized {" "} 
            {submittedData.formType === "yoga" ? "Yoga Plan" : "Diet Plan (Weekly)"}
          </h2>
          {submittedData.formType === "yoga" ? (
            <>
              <div className="mb-2 font-mono">
                <p>
                  <strong>BMI:</strong> {submittedData.bmi}
                </p>
                <p>
                  <strong>BMI Category:</strong> {submittedData.bmi_category}
                </p>
              </div>
              <h3 className="text-xl font-bold mt-3 mb-1">Recommended Poses:</h3>
              {submittedData.recommended_poses.length > 0 ? (
                <ul className="space-y-2">
                  {submittedData.recommended_poses.map((pose, index) => (
                    <li key={index}>
                      <strong>{pose.pose_name}:</strong> {pose.benefits}
                    </li>
                  ))}
                </ul>

              ) : (
                <p>No poses recommended.</p>
              )}
            </>
          ) : (
            <>
                {submittedData.weeklyDietPlan && submittedData.weeklyDietPlan.length > 0 ? (
                  submittedData.weeklyDietPlan.map((dayPlan, dayIndex) => (
                    <div key={dayIndex} className="mb-4">
                      <h4 className="font-bold text-xl">{`Day ${dayPlan.day}:`}</h4>
                      <ul className="space-y-2">
                        {Object.entries(dayPlan.meals).map(([mealType, meal], mealIndex) => (
                          <li key={mealIndex}>
                            <strong>{mealType}:</strong> {meal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p>No diet plan available.</p>
                )}
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Yoga Form */}
          {formType === "yoga" && (
            <>
              <h2 className="text-center font-mono text-2xl text-main_text mb-6">
                Personalized Yoga Poses
              </h2>
              <div className="mb-4 flex space-x-6">

                <div className="flex-1">
                  <label htmlFor="height" className="block text-main_text mb-2"> Height (cm) </label>
                  <input type="number" id="height" name="height" required value={formData.height} min={10} onChange={handleChange}
                    className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent"
                    placeholder="Enter your height in cm" />
                </div>

                <div className="flex-1">
                  <label htmlFor="weight" className="block text-main_text mb-2"> Weight (kg) </label>
                  <input type="number" id="weight" name="weight" required value={formData.weight} onChange={handleChange} min={1}
                    className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent"
                    placeholder="Enter your weight in kg" />
                </div>

              </div>

              <div className="mb-4">
                <label htmlFor="age" className="block text-main_text mb-2 w-full"> Age </label>
                <input type="number"id="age" name="age" required value={formData.age} min={1} onChange={handleChange}
                  className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent"
                  placeholder="Enter your age"/>
              </div>

              <div className="mb-4">
                <label htmlFor="bmi" className="block text-main_text mb-2"> BMI (Optional) </label>
                <input  type="number" id="bmi" name="bmi" value={formData.bmi} min={1} onChange={handleChange}
                  className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent"
                  placeholder="Enter your BMI (if known)" />
              </div>

              <div className="mb-4">
                <label htmlFor="goal" className="block text-main_text mb-2"> Goal </label>
                <input type="text" id="goal" name="goal" required value={formData.goal} onChange={handleChange}
                  className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent"
                  placeholder="What is your fitness goal?"/>
              </div>

              <div className="mb-4">
                <label htmlFor="health-issues" className="block text-main_text mb-2"> Health Issues </label>
                <input type="text" id="health-issues" name="healthIssues" value={formData.healthIssues} onChange={handleChange}
                  className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent"
                  placeholder="Any health issues we should know?"/>
              </div>

              <div className="mb-6">
                <label htmlFor="experience-level" className="block text-main_text mb-2" > Experience Level </label>
                <select id="experience-level" name="experienceLevel" required value={formData.experienceLevel} onChange={handleChange}
                  className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent">
                  
                  <option value="">Select Experience Level</option>
                  <option value="beginner">Beginner</option>
                  <option value="medium">Intermediate</option>
                  <option value="expert">Expert</option>

                </select>
              </div>
            </>
          )}

          {/* Diet Form */}
          {formType === "diet" && (
            <>
              <h2 className="text-center font-mono text-2xl text-main_text mb-6">
                Personalized Diet Plan
              </h2>
              <div className="mb-4 flex space-x-6">
                <div className="flex-1">
                  <label htmlFor="height" className="block text-main_text mb-2"> Height (cm) </label> 
                  <input type="number" id="height" name="height" required value={formData.height} min={10} onChange={handleChange}
                    className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent"
                    placeholder="Enter your height in cm"/>
                </div>

                <div className="flex-1">
                  <label htmlFor="weight" className="block text-main_text mb-2"> Weight (kg) </label>
                  <input type="number" id="weight" name="weight" min={1} required value={formData.weight} onChange={handleChange}
                    className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent"
                    placeholder="Enter your weight in kg" />
                </div>
              </div>

              <div className="mb-4 flex space-x-6">
                <div className="mb-4 flex-1">
                  <label htmlFor="age" className="block text-main_text mb-2"> Age </label>
                  <input type="number" id="age" name="age" required value={formData.age} min={1} onChange={handleChange}
                    className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent"
                    placeholder="Enter your age" />
                </div>

                <div className="mb-4 flex-1"> <label htmlFor="gender" className="block text-main_text mb-2"> Gender </label>
                  <select id="gender" name="gender" required value={formData.gender} onChange={handleChange}
                    className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>

                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="bmi" className="block text-main_text mb-2"> BMI (Optional) </label>
                <input type="number" id="bmi" name="bmi" value={formData.bmi} min={1} onChange={handleChange}
                  className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent"
                  placeholder="Enter your BMI (if known)"/>
              </div>

              <div className="mb-4">
                <label htmlFor="goal" className="block text-main_text mb-2"> Goal </label>
                <input type="text" id="goal" name="goal" required value={formData.goal} onChange={handleChange}
                  className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent"
                  placeholder="What is your diet goal?"/>
              </div>

              <div className="mb-4">
                <label htmlFor="health-issues" className="block text-main_text mb-2"> Health Issues </label>
                <input type="text" id="health-issues" name="healthIssues" value={formData.healthIssues} onChange={handleChange}
                  className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent"
                  placeholder="Any health issues we should know?"/>
              </div>

              <div className="mb-4">
                <label htmlFor="diet" className="block text-main_text mb-2"> Diet Type </label>
                <select id="diet" name="diet" required value={formData.diet} onChange={handleChange}
                  className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent">
                  <option value="">Select Diet</option>
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                  <option value="eggitarian">Eggitarian</option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="activityLevel" className="block text-main_text mb-2"> Activity Level </label>
                <select id="activityLevel" name="activityLevel" required value={formData.activityLevel} onChange={handleChange}
                  className="w-full p-3 border border-secondary_bg bg-primary_bg text-main_text rounded-md focus:outline-none focus:ring-2 focus:ring-primary_accent">
                  
                  <option value="">Select Activity Level</option>
                  <option value="no-exercise">No Exercise</option>
                  <option value="light-activity">Light Activity</option>
                  <option value="moderate">Moderate Activity</option>
                  <option value="very-active">Very Active</option>
                </select>

              </div>
            </>
          )}

          <div className="text-center">
            <button type="submit"
              className="mt-4 px-6 py-3 bg-primary_bg text-main_text font-semibold border-2 border-accent_border hover:bg-primary_accent/60 transition-colors">
              Submit
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default HealthForm;
