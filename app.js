const express = require("express");
const axios = require("axios");
const ejs = require("ejs");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", async (req, res) => {
  const doctors = await fetchDoctors();
  console.log("Doctors:", doctors);
  res.render("index", { doctors });
});

app.get("/doctor/:id", async (req, res) => {
  const doctorId = req.params.id;
  const [doctor, similarDoctors] = await Promise.all([
    fetchDoctor(doctorId),
    fetchSimilarDoctors(doctorId),
  ]);
  console.log("Doctor:", doctor);
  console.log("Similar Doctors:", similarDoctors);
  res.render("doctor", { doctor, similarDoctors });
});

const fs = require("fs").promises;

async function fetchDoctors() {
  const data = await fs.readFile("./doctors.json", "utf-8");
  return JSON.parse(data);
}

async function fetchDoctor(id) {
  const doctors = await fetchDoctors();
  return doctors.find((doctor) => doctor.id === parseInt(id));
}

/*
  Similar doctors are determined based on the following criteria:
    1. Doctors who share the same specialty and location as the selected doctor.
    2. Doctors who share the same specialty as the selected doctor but have a different location.
    3. Doctors who share the same location as the selected doctor but have a different specialty.

  Assumptions:
    1. The specialty and location of a doctor are the most important factors for determining similarity.
    2. The specialty is considered more important than the location, as reflected in the higher weight (2 points) given to the specialty in the
*/
async function fetchSimilarDoctors(id) {
  const doctors = await fetchDoctors();
  const targetDoctor = await fetchDoctor(id);

  function similarityScore(doctor) {
    let score = 0;
    if (doctor.specialty === targetDoctor.specialty) score += 2;
    if (doctor.area === targetDoctor.area) score += 1;
    return score;
  }

  return doctors
    .filter((doctor) => doctor.id !== parseInt(id))
    .sort((a, b) => {
      const aScore = similarityScore(a);
      const bScore = similarityScore(b);
      return bScore - aScore;
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
