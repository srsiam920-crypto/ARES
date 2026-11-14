# 🚀 ARES OS — Autonomous Recovery and Equilibrium System

> **2026 NASA International Space Apps Challenge | Theme: *The Next Frontier***
>
> **Challenge:** *Create Health Monitoring Software for Astronauts on Space Missions*
>
> **Team:** **Team ARES** (Dhaka, Bangladesh)

## 🌐 Quick Links for Judges (No Login Required)

* **🟢 Live Interactive Web Application:** [**https://ares-os.ai.studio/**](https://ares-os.ai.studio/)
* **🎬 30-Second Global Judging Demo ("30 Seconds of Glory"):** [**https://youtu.be/kYQF0Hg2ckA**](https://youtu.be/kYQF0Hg2ckA)
* **🎥 240-Second Full Pitch & Demo ("240 Seconds of Glory"):** [**https://youtu.be/HOn9djcO7g4**](https://youtu.be/HOn9djcO7g4)
* **💻 Public GitHub Repository:** [**https://github.com/srsiam920-crypto/ARES**](https://github.com/srsiam920-crypto/ARES)

## 👨‍🚀 Team ARES

| Team Member | Role & Contributions | 
| ----- | ----- | 
| **Saimur Rahman Siam** | **Team Leader, Research Strategist & UI Designer** — System architecture, NASA-STD-3001 clinical mapping, dark-cockpit UI/UX design, and frontend engineering. | 
| **Nuzhatun Nahar** | **Storyteller & Research Assistant** — Behavioral health literature synthesis, scriptwriting, narrative design, and video production. | 

## 📖 High-Level Summary

**ARES OS (Autonomous Recovery and Equilibrium System)** is an AI-powered, closed-loop neuro-therapeutic operating system and behavioral health sanctuary engineered for astronauts on long-duration space missions. When crews travel toward Mars, communication delays of up to $40\text{ minutes}$ round-trip make real-time psychological crisis intervention from Earth impossible.

Grounded in **NASA-STD-3001 Volume 1 Revision C**, **NASA Human Research Program (HRP)** datasets, and **Canadian Space Agency (CSA)** radiation health research, **ARES OS** passively fuses multi-modal crew telemetry—ECG, Heart Rate Variability (HRV), $\text{SpO}_2$, EEG brainwave spectra, and acoustic voice-pitch jitter—into a real-time **Acute Distress Index (ADI)**. When elevated stress or circadian misalignment is detected, the system autonomously initiates a zero-effort therapeutic reset: shifting cabin phototherapy to blue-depleted $1800\text{ K}$ amber light, activating $40\text{ Hz}$ vibroacoustic bed resonance and $6\text{ Hz}$ Theta binaural beats, guiding voice-based **AI Psychological First Aid (AI PFA)**, and projecting optical-infinity VR Earth biomes with pre-buffered family video messages. For acute psychosis emergencies, role-specific interfaces enforce encrypted logs, live triage, and a **Level-4 Dual-Key Emergency Anti-Psychotic Protocol (EAP)** alongside an **Astronaut Emergency Override (Doomsday Protocol)** if command officers are unable to respond.

## ❗ The Problem (The Why)

On a $30\text{-month}$ interplanetary mission to Mars, astronauts confront NASA HRP's **5 Hazards of Human Spaceflight**: Distance from Earth, Isolation and Confinement, Hostile/Closed Environments, Altered Gravity Fields, and Space Radiation:

1. **The Deadly** $40\text{-Minute}$ **Communication Delay:** Radio signals take up to $20\text{ minutes}$ one-way ($40\text{ minutes}$ round-trip) between Mars and Earth. During acute panic, severe insomnia, or psychosis, Earth cannot intervene in real time.

2. **High Frequency of Sleep & Behavioral Conditions:** NASA's **Integrated Medical Model (IMM)** (*NASA-STD-3001 Vol. 1 Rev. C, Table E.2-1, p. 81*) identifies **Late Insomnia** as the #1 most frequent medical event in spaceflight ($13.85\text{ occurrences per mission}$), followed by **Space Motion Sickness** ($4.37\text{/mission}$) and **Spaceflight Associated Neuro-Ocular Syndrome (SANS)** ($2.08\text{/mission}$).

3. **The "Third Quarter Phenomenon":** Content analysis of confidential astronaut journals (*Stuster, 2010*) proves a severe drop in emotional positivity and morale during the third quarter of long expeditions due to sensory monotony, $60\text{ dB}$ life-support noise, and separation from family.

4. **Under-Reporting Due to Career Fear:** Astronauts frequently withhold early psychological symptoms from ground flight surgeons during Private Medical Conferences out of fear of flight disqualification (*Stuster, 2010, p. 57*).

5. **NASA's Clinical Mandate:** **NASA-STD-3001 Vol. 1 Rev. C \[V1 3004.q\]** explicitly mandates that spacecraft provide autonomous, asynchronous electronic protocols to diagnose and treat neurobehavioral disorders in mission.

## 🛠️ How ARES OS Works (Core Architecture)

Live at [**https://ares-os.ai.studio/**](https://ares-os.ai.studio/), **ARES OS v2.4** is designed around NASA's low-cognitive-load **"Dark Cockpit"** human-factors paradigm, featuring role-specific interfaces for every designated crew member (**Mission Specialist / Patient**, **Crew Medical Officer \[CMO\]**, and **Flight Commander**):

### 1. Biometrics & Waveforms Engine

* Passively monitors multi-modal telemetry without forcing fatigued astronauts to fill out questionnaires.

* Tracks **Lead-II ECG** ($87\text{ BPM}$), depressed **Heart Rate Variability (HRV)** ($53\text{ ms}$), blood oxygen ($\text{SpO}_2 = 98\%$), **EEG Power Spectra** ($\delta, \theta, \alpha, \beta$ bands), and **Acoustic Voice-Pitch Jitter** ($3.2\%$) alongside $10\text{ RPM}$ ($0.22g$) short-radius centrifuge telemetry.

* Computes a real-time composite **Acute Distress Index (ADI = 0.59 Moderate)** using standardized thresholds from the **AGBRESA 60-Day Bed Rest Study**.

$$
\mathrm{ADI} = w_1 \left(\frac{\Delta \mathrm{HR}}{\mathrm{HR}_0}\right) + w_2 \left(\frac{\mathrm{HRV}_0 - \mathrm{HRV}}{\mathrm{HRV}_0}\right) + w_3 \left(\frac{\beta_{\mathrm{EEG}}}{\alpha_{\mathrm{EEG}} + \theta_{\mathrm{EEG}}}\right) + w_4 \left(\mathrm{Jitter}_{\mathrm{pct}}\right)
$$

### 2. Closed-Loop Therapeutic Matrix

When the $\mathrm{ADI}$ crosses nominal Permissible Outcome Limits, **ARES OS** autonomously initiates a gentle, zero-effort environmental reset:

* **Dynamic Circadian Phototherapy:** Shifts solid-state cabin lighting from $6500\text{ K}$ Wake Cyan to a blue-depleted $1800\text{ K}$ Sleep Amber spectrum to stimulate endogenous melatonin production and protect the $8.5\text{-hour}$ sleep window per **NASA-STD-3001 \[V1 6001\]**.

* **Acoustic & Somatosensory Therapy:** Activates $40\text{ Hz}$ vibroacoustic bed resonance and $2\text{--}12\text{ kPa}$ deep-pressure seat stimulation alongside $6\text{ Hz}$ Theta binaural beats and Pacific Northwest rain soundscapes to mask cabin noise and relieve muscle rigidity.

### 3. AI PFA (Psychological First Aid) Protocol

* Powered by the **Google Gemini API**, providing an asynchronous, non-judgmental conversational companion during $40\text{-minute}$ communication blackouts or solar-storm lockdowns.

* Implements the **Net Positivity/Negativity (**$\text{NPN}$**)** sentiment tracking formula from NASA's *Astronaut Journals* experiment (*Stuster, 2010*):

$$
\text{NPN} = \left(\frac{N_{\text{positive}}}{N_{\text{total}}}\right) - \left(\frac{N_{\text{negative}}}{N_{\text{total}}}\right)
$$

* Guides real-time breathing, progressive relaxation, sensory masking, and cognitive restructuring based on NASA's behavioral health countermeasures (*Moomaw, 2011*).

### 4. VR Immersion, Family Media Buffer & Level-4 Dual-Key Safety Protocols

* **Optical-Infinity VR Biophilia:** Projects $360^\circ$ rain, ocean, and forest biomes focused at optical infinity ($\infty$) to relax ciliary muscle accommodation (mitigating close-quarters ocular strain associated with SANS) while streaming pre-buffered family video messages to preserve oxytocin and soothe "Earth-out-of-view" grief.

* **Role-Specific Interfaces, Encrypted Logs & Live Triage:** Separates private astronaut psychological logs (**NASA-STD-3001 \[V1 6010\]**) from clinical triage dashboards for the **CMO** and **Flight Commander**.

* **Level-4 Dual-Key Emergency Anti-Psychotic Protocol (EAP):** Recognizing **Psychosis** and **Delirium** as high-consequence spaceflight risks (**NASA-STD-3001 Table E.2-2, p. 85**), unlocking the EAP requires simultaneous encrypted **Dual-Key Authorization** (`KEY A` + `KEY B`) from both the **Flight Commander** and **CMO** per **\[V1 3004.k\]**, **\[V1 3006\]**, and the **ISS 3.001 Medical Kit Checklist** (which carries intramuscular Aripiprazole $7.5\text{ mg/mL}$ and Diazepam $5\text{ mg/mL}$).

* **Astronaut Emergency Override (Doomsday Protocol):** If both the Flight Commander and CMO are unable to respond during a mission-critical emergency, a safeguarded time-locked override unlocks autonomous life-saving care.

## 📊 Official NASA & Space Agency Partner Datasets Used

### Official Challenge Resources (NASA & CSA)

1. [**NASA HRP — 5 Hazards of Human Spaceflight**](https://www.nasa.gov/hrp/hazards/)**:** Used to architect ARES OS around Distance from Earth ($40\text{-min}$ Mars delay), Isolation & Confinement, Hostile/Closed Environments, Altered Gravity, and Space Radiation.

2. [**NASA HRP — Risks of Human Spaceflight**](https://www.nasa.gov/hrp/risks/)**:** Used to calibrate our Acute Distress Index (ADI) around Behavioral Medicine (BMed), Inadequate Sleep/Circadian misalignment, and SANS risks.

3. [**NASA HRP — Ongoing HRP Research in Space**](https://www.nasa.gov/hrp/ongoing-hrp-research/)**:** Used to model our closed-loop Therapeutic Matrix (dynamic solid-state lighting, vibroacoustics, and asynchronous behavioral countermeasures).

4. [**Canadian Space Agency (CSA) — Monitoring Radiation for Astronaut Health**](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp)**:** Integrated to correlate radiation spike alerts with Central Nervous System (CNS) cognitive/emotional telemetry and automatic AI PFA activation during solar-storm shelter-in-place lockdowns.

5. [**Canadian Space Agency (CSA) — Why Do We Conduct Science Experiments in Space?**](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp)**:** Used to structure our space-to-Earth terrestrial impact pathway for isolated environments on Earth.

### Core NASA Clinical Standards & Empirical Datasets

 6. **NASA-STD-3001, Volume 1, Revision C (2023) — *NASA Spaceflight Human-System Standard: Crew Health*:** Clinical requirements `[V1 3003]`, `[V1 3004.k/q]`, `[V1 3006]`, `[V1 6001]`, `[V1 6010]` & Appendix E Integrated Medical Model (IMM) probabilistic risk datasets (Tables E.2-1 & E.2-2).

 7. **NASA HRP International Standard Measures (ISM) & Life Sciences Data Archive (LSDA) — *AGBRESA 60-Day Bed Rest Dataset* (*Clément et al., 2022*):** Used for physiological, ocular, PANAS affect, and General Health Questionnaire (GHQ) baselines.

 8. **NASA Behavioral Health & Performance *Astronaut Journals* Dataset (*Experiment 01-E104, Stuster, 2010*):** Used to program our Net Positivity/Negativity ($\text{NPN}$) sentiment algorithm and third-quarter isolation countermeasures.

 9. **ISS 3.001 Medical Kit Contents & Reference Checklist (*NASA JSC*):** Used to model behavioral health medication rules, dosages, and Physician-CMO restrictions.

10. [**NASA Open Data APIs (`api.nasa.gov`)**](https://api.nasa.gov/)**:** Integrated for mission environment and telemetry context.

## 🌍 Impact & What We Would Build Next

* **Spaceflight Validation Roadmap:** Following NASA's **Human Research Program Analog Roadmap (*Vessey et al., 2020*)**, **ARES OS** is ready for immediate ground validation inside **HERA** (NASA Johnson Space Center's $45\text{-day}$ isolation habitat), **:envihab** (DLR Cologne), and **NEK/SIRIUS** before deployment on **Artemis Lunar Gateway** and **Mars Transit Habitats**.

* **Terrestrial Impact on Earth:** Directly benefits personnel in Isolated, Confined, and Extreme (ICE) environments on Earth—including **Antarctic winter-over research stations, nuclear submarine crews, offshore oil rigs, and rural ICU telehealth pods**.

* **Next Development Steps:** Hardware-in-the-loop integration with wearable smart-garment ECG/EDA biosensors, automated portable OCT ocular scans for SANS tracking, and offline edge-LLM deployment for zero-latency spacecraft execution.

## 💻 Tech Stack & Engineering Considerations

* **Frontend & UI Architecture:** HTML5, CSS3, Tailwind CSS, TypeScript / JavaScript, React, and **Google AI Studio**.

* **Audio & Biosignal Simulation:** Web Audio API (real-time $6\text{ Hz}$ Theta binaural beat and $40\text{ Hz}$ vibroacoustic frequency synthesis).

* **AI & Voice Synthesis:** **Google Gemini API** (AI PFA conversational grounding & sentiment engine) and **ElevenLabs API** (human-emotional voice narration).

* **Design & Production:** **Canva** and **Google Flow**.

* **Energy, Accessibility & Cost:** Runs locally with minimal wattage during communication blackouts; uses tremor-safe wide sliders and high-contrast color coding per **NASA-STD-3001 Volume 2** so an astronaut in acute distress needs zero training to use it.

## 🤖 Mandatory Use of AI / Super Intelligence (SI) Disclosure

In full compliance with the 2026 NASA Space Apps Challenge guidelines on transparent AI/SI usage:

1. **In-App AI PFA & Code Prototyping (Google Gemini / Google AI Studio):** Used to assist with frontend React/Tailwind component scaffolding and to power the live **AI Psychological First Aid (AI PFA)** module inside [`https://ares-os.ai.studio/`](https://ares-os.ai.studio/), prompted with clinical constraints from **NASA-STD-3001 Rev. C**, **Moomaw (2011)**, and **Stuster (2010)**.

2. **Voiceover Synthesis (ElevenLabs):** Used to generate the English voiceover narration for our $240\text{-second}$ and $30\text{-second}$ videos from our original human-written script, as well as pre-recorded acoustic grounding prompts in the app.

3. **Concept Visualizations (Google Flow & Canva):** AI visual generation tools were used with visible watermarks/credits to illustrate the physical ARES Pod hardware concept and deep-space transit scenes, which our team composited and edited alongside authentic live screen recordings of our working software. **No NASA logos, flags, branding, or mission identifiers were generated or modified using AI/SI tools.**

## 🚀 Running the Project Locally

Judges can test the live application immediately at [**https://ares-os.ai.studio/**](https://ares-os.ai.studio/) or run the source code locally:

```bash
# 1. Clone the repository
git clone https://github.com/srsiam920-crypto/ARES.git

# 2. Navigate into the project directory
cd ARES

# 3. Install dependencies
npm install

# 4. Start the local development server
npm run dev
```

## 📚 Scientific References

1. Clément, G. R., Crucian, B. E., Downs, M., et al. (2022). International standard measures during the AGBRESA bed rest study. *Acta Astronautica*, 200, 163–175.

2. Moomaw, R. (2011). *Cognitive Behavioral Training and Education for Spaceflight Operations* (NTRS ID: 20110016259). NASA Johnson Space Center.

3. National Aeronautics and Space Administration (NASA). (2023). *NASA Spaceflight Human-System Standard, Volume 1: Crew Health* (NASA-STD-3001, Vol. 1, Rev. C). Office of the Chief Health and Medical Officer (OCHMO).

4. National Aeronautics and Space Administration (NASA). (2015). *3.001 Medical Kit—Contents and Reference (MED CL/SPX-6 - ALL/FIN/T)*. NASA Johnson Space Center.

5. Stuster, J. (2010). *Behavioral Issues Associated With Long Duration Space Expeditions: Review and Analysis of Astronaut Journals* (Experiment 01-E104 Final Report, NASA/TM-2010-216130). NASA Johnson Space Center.

6. Tays, G. D., McGregor, H. R., Lee, J. K., et al. (2022). The effects of 30 minutes of artificial gravity on cognitive and sensorimotor performance in a spaceflight analog environment. *Frontiers in Neural Circuits*, 16, 784280.

7. Vessey, W. B., Pido, K. I., Pietrzyk, R. A., Primeaux, L. L., & Yarbough, P. O. (2020). *Virtual Tours at the Virtual HRP IWS: NASA Analogs for Spaceflight Research*. NASA Human Research Program.

*Built with ❤️ by **Team ARES** (Saimur Rahman Siam & Nuzhatun Nahar) for the 2026 NASA International Space Apps Challenge.*
