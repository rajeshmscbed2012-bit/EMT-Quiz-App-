export interface KnowledgeTopic {
  topic: string;
  content: string;
  isCustom?: boolean;
}

export const emtKnowledgeBase: KnowledgeTopic[] = [
  {
    topic: "Tranexamic Acid (TXA)",
    content: `DRUG NAME: TRANEXAMIC ACID
PRESENTATION: Vial -10ml (100mg/1ml), Ampoule -5ml (100mg/1ml)
Action: Blocking the breakdown of blood Clot Formation (Anti fibrinolytic drug)
Indication: To treat or prevent excessive blood loss from Major trauma (Victim with severe Bleeding in trauma (Above 300-500ml Blood loss)), Crush Injury, Pelvic Fracture, Fracture, Traumatic extremity amputation, Nosebleeds, Heavy menstruation, Postpartum Haemorrhage (Above 500ml Blood loss).
Contra-indication: No ERCP advise, Allergic to tranexamic acid, History of seizures, Severe kidney impairment, Greater then 3 hours from Bleeding.
Dosage Adult (≥12 years): First dose (1grm in 100ml NS-Bolus over 10mins), 2nd Dose: 1grm in 100ml NS-Infusion Over 8 hours.
Paediatric Dose (< 12 years): First dose: 15mg/kg over 10mins-Bolus. 2nd Dose: 2mg/kg/hour.
Side effects: Severe gastrointestinal symptoms, Hypotension, Changes in colour vision, Blood clots, Allergic reactions such as anaphylaxis.`
  },
  {
    topic: "Cardioprotective Loading Dose",
    content: `Chest Pain (Angina): Symptom of inadequate blood supply to the cardiac muscles. Only 11 to 28% are real heart attack. 50% of deaths occurs in first 2 hours.
Causes of Chest pain: Myocardial infarction, Pulmonary embolism, Aortic dissection, Pericardial effusion.
Risk Factors: Age, Family History, Hypertension, Hypercholesterolemia, Smoking, Diabetes, Diet, Lack of Exercise, Obesity.
Signs and Symptoms: Chest Discomfort - Squeezing, Radiates to arms, jaw, neck & back. Epigastric pain, Dyspnea, Nausea, Vomiting, Weakness, Dizziness & fainting, Diaphoresis.
Loading dose: Aspirin 150 mg x2=300mg (Anti Platelet), Clopidogrel 75mgx4=300mg (Anti-Coagulant), Atorvastatin 20mgx 4=80mg (Antihyperlipidemic).`
  },
  {
    topic: "Vital Signs",
    content: `Normal Ranges:
Respiration: Adults 12-20, Children 15-30, Infants 25-50, New-born 40-60 breaths/min.
Pulse: Adults 60-100, Children 80-120, Infants 100-150, New-born 120-160 beats/min.
Blood Pressure (Systolic): Above 10yrs 100-140mmHg, 1yr to 10yrs 70+(Age*2)mmHg, Below 1 yr 60mmhg.
Pupils: Normal size 2.5-3 mm. Constricted (Organophosphorus Poison), Dilated (Atropine intoxication), Unequal (Head injury, Stroke).
Temperature: Normal 98.6F / 37C.
Oxygen Saturation (SPO2): Normal > 95%.
Blood Sugar: Adult 70-140 mg/dl, Children/Infant 60-140 mg/dl, Neonate 45-200 mg/dl.`
  },
  {
    topic: "Post Partum Haemorrhage (PPH)",
    content: `Defined as blood loss of 500ml or more within 24 hours after child birth.
Classification: 300-500ml (Mild), 500-1000ml (Moderate), Above 1000ml (Severe).
Causes (4 T's): Tone (Uterine Atony), Tissue (Retained placenta), Trauma (Ruptured uterus), Thrombin (Bleeding disorders).
Management of hypovolaemic shock: ABC, Oxygenate O2 by NRB mask @ 12-15 liters, 2 large bore IV Lines, Oxytocin 20 Units in 500ml NS.`
  },
  {
    topic: "Basic Airway Management",
    content: `Levels of Consciousness (AVPU): Alert, Verbal, Painful, Unresponsive.
Airway Maneuvers: Head-Tilt Chin-Lift (Non-trauma), Jaw Thrust (Trauma).
Suctioning Time Limits: Adult 15 Sec, Child 10 Sec, Infant 5 Sec, Newborn 3 Sec.
Oropharyngeal Airway (OPA): For unresponsive patient without gag reflex. Sizing from corner of mouth to angle of jaw.
Nasopharyngeal Airway (NPA): For unresponsive patient with gag reflex. Contraindicated with suspected skull fracture.`
  },
  {
    topic: "Oxygenation and Ventilation",
    content: `Ventilation Rates (BVM): Adult 10-12, Children 15-20, Infant 15-20, Neonate 40-60 breaths/min.
Oxygen Delivery: Nasal Canula (1-6 L/min, 24-44%), Simple Face Mask (6-10 L/min, 35-60%), Non-Rebreather Mask (10-15 L/min, up to 90%).`
  },
  {
    topic: "Trauma Patient Assessment",
    content: `Primary Survey (GRC-ABC): General impression, Response, Circulation, Airway, Breathing.
SAMPLE History: Signs/Symptoms, Allergies, Medications, Past medical history, Last oral intake, Events leading to illness.
OPQRST for Pain: Onset, Provocation, Quality, Radiation, Severity, Time.
Rapid Trauma Assessment (DCAP-BTLS): Deformities, Contusions, Abrasions, Punctures/Penetrations, Burns, Tenderness, Lacerations, Swelling.`
  },
  {
    topic: "IV Cannulation",
    content: `Gauge and Flow Rate: 18G (Green, 90ml/min), 20G (Pink, 60ml/min), 22G (Blue, 36ml/min), 24G (Yellow, 20ml/min).
Patient Stability: Stable (One IV), Unstable/Shock (Two large bore IVs).`
  },
  {
    topic: "Emergency Drugs",
    content: `Adrenaline: Cardiac Arrest, Severe Allergic Reactions.
Atropine: Bradycardia, OP Poison.
Magnesium Sulphate: Pre-Eclampsia, Eclampsia.
Midazolam: Seizures.
Oxytocin: Postpartum hemorrhage (PPH).
Salbutamol: Wheezing, Acute Asthma.`
  }
];