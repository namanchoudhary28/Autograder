import React, { useState } from "react";
import api from "../../shared/api/axios";
import "./AddProblem.css";

const AddProblem = () => {
  const [problem, setProblem] = useState({
    title: "",
    description: "",
    difficulty: "easy",
    testCases: [{ input: "", output: "" }]
  });

  const changeHandler = (e) => {
    setProblem({ ...problem, [e.target.name]: e.target.value });
  };

  const changeTestCaseHandler = (e, index) => {
    const updated = [...problem.testCases];
    updated[index][e.target.name] = e.target.value;
    setProblem({ ...problem, testCases: updated });
  };

  const addTestCase = () => {
    setProblem({
      ...problem,
      testCases: [...problem.testCases, { input: "", output: "" }]
    });
  };

  const deleteTestCase = (index) => {
    const updated = problem.testCases.filter((_, i) => i !== index);
    setProblem({ ...problem, testCases: updated });
  };

  const handleSubmit = async () => {
    try {
      await api.post("/problems/create", problem);
      alert("Problem created successfully");

      // reset form
      setProblem({
        title: "",
        description: "",
        difficulty: "easy",
        testCases: [{ input: "", output: "" }]
      });
    } catch (err) {
      alert("Failed to create problem");
    }
  };

  return (
    <div className="add-problem">
      <h2>Add Problem</h2>

      <input
        type="text"
        name="title"
        placeholder="Title"
        value={problem.title}
        onChange={changeHandler}
      />

      <textarea
        name="description"
        placeholder="Description"
        value={problem.description}
        onChange={changeHandler}
      />

      <select
        name="difficulty"
        value={problem.difficulty}
        onChange={changeHandler}
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <h4>Test Cases</h4>

      {problem.testCases.map((val, ind) => (
        <div className="testcase" key={ind}>
          <textarea
            name="input"
            placeholder="Input"
            value={val.input}
            onChange={(e) => changeTestCaseHandler(e, ind)}
          />

          <textarea
            name="output"
            placeholder="Expected Output"
            value={val.output}
            onChange={(e) => changeTestCaseHandler(e, ind)}
          />

          {problem.testCases.length > 1 && (
            <button
              className="delete-btn"
              onClick={() => deleteTestCase(ind)}
            >
              Delete
            </button>
          )}
        </div>
      ))}

      <button onClick={addTestCase}>+ Add Test Case</button>
      <button className="submit-btn" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
};

export default AddProblem;
