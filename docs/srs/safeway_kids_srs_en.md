# SAFEWAY KIDS
## AI-Powered Children's School Shuttle Bus Sharing Platform — Software Requirements Specification (SRS)

**Version 1.0 | March 13, 2026 | CONFIDENTIAL**

---

## Table of Contents

1. [Platform Name Proposal](#1-platform-name-proposal)
2. [Market Analysis Summary (Executive Summary)](#2-market-analysis-summary-executive-summary)
3. [Stakeholder Analysis and Pros/Cons](#3-stakeholder-analysis-and-proscons)
4. [Legal and Regulatory Requirements](#4-legal-and-regulatory-requirements)
5. [System Architecture Design](#5-system-architecture-design)
6. [AI Feature Detailed Requirements](#6-ai-feature-detailed-requirements)
7. [Frontend UI/UX Feature Specification](#7-frontend-uiux-feature-specification)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Development Roadmap and Phase Milestones](#9-development-roadmap-and-phase-milestones)
10. [Conclusion and Strategic Recommendations](#10-conclusion-and-strategic-recommendations)

---

## 1. Platform Name Proposal

### 1.1 Final Recommended Name: SAFEWAY KIDS

The final recommended name for this platform is **'SAFEWAY KIDS'**. Combining 'Safe + Way + Kids', the name intuitively conveys the platform's core mission of "a safe path for children." It is naturally pronounceable and memorable in both Korean and English, and delivers the sense of trust appropriate for B2C marketing targeting parents.

### 1.2 Name Selection Criteria and Comparative Analysis

The following five core criteria were applied to compare and evaluate name candidates: (1) safety association, (2) ease of pronunciation, (3) brand extensibility, (4) domain/trademark availability, (5) emotional trust for parent audience.

| Candidate Name | Safety Association | Ease of Pronunciation | Brand Extensibility | Domain Availability | Overall |
|---|---|---|---|---|---|
| **SAFEWAY KIDS** | ★★★★★ | ★★★★★ | ★★★★ | ★★★★★ | **Excellent** |
| TayoBus | ★★★ | ★★★★★ | ★★★ | ★★ | Good |
| i-Ride | ★★★★ | ★★★★ | ★★★★ | ★★★ | Good |
| AnsimCar | ★★★★★ | ★★★ | ★★★ | ★★★★ | Fair |
| KidsAround | ★★★ | ★★★ | ★★★★★ | ★★★ | Fair |

'SAFEWAY KIDS' scored the highest across safety association, ease of pronunciation, and domain availability, making it the final recommendation. In particular, the keyword 'safety'—most critical for a B2C platform targeting parents—is embedded in the brand name itself, giving it an advantage in building trust at initial market entry.

---

## 2. Market Analysis Summary (Executive Summary)

### 2.1 Market Environment Analysis

Due to structural changes in Korean society, the children's school commute mobility market has reached an explosive growth inflection point. Six out of ten couples in their 30s–40s are dual-income households, and they rely on private tutoring institutions to cover childcare gaps after regular school hours. The phenomenon where the criterion for choosing a tutoring academy has devolved from educational quality to 'whether a shuttle bus is provided' creates educational inequality and causes extreme scheduling stress for households.

The current structure—where individual academies directly own vehicles and hire drivers, or enter individual contracts with owner-operators—results in serious resource waste and inefficiency. Just as the restaurant delivery industry evolved from individual restaurant-employed couriers to integrated delivery platforms, the school commute market is equally due for a major paradigm shift.

### 2.2 Key Market Indicators

| Indicator | Figures and Interpretation |
|---|---|
| Total private tutoring spending (2024) | KRW 27.5 trillion (down 5.7% year-over-year) |
| Average monthly spending per participating student | KRW 604,000 (up 2.0% year-over-year) |
| Private tutoring participation rate | 75.7% (down 4.3%p year-over-year) |
| Income polarization pattern | Low-income: down 11% sharply vs. high-income: down only 2.1% |
| ShuttleTayo cost reduction effect | Approx. 30% cost savings vs. individual operation rates |
| ShuttleTayo customer churn rate | Approaching 0% (overwhelming lock-in effect) |

These indicators clearly suggest that the private education market has entered an era of qualitative premiumization from quantitative expansion, and that dual-income households spending KRW 600,000+ per month on private education have a strong willingness to pay (WTP) for premium safety mobility services.

---

## 3. Stakeholder Analysis and Pros/Cons

### 3.1 Value Proposition and Risk Analysis by Stakeholder

| Stakeholder | Structural Advantages (Pros) | Potential Risks (Cons) |
|---|---|---|
| **Parents (demand side)** | Real-time location tracking alleviates anxiety / Verified modern vehicles with background-checked drivers / Instant in-app schedule changes | Resistance to cost transfer due to monetization of previously free services / Risk of extended in-vehicle time due to shared nature |
| **Tutoring Academies (supply side)** | Up to 30% reduction in fixed costs including vehicle maintenance and driver hiring / Allows focus on core educational work | Loss of offline advertising opportunities (e.g., vehicle branding) / Risk of fee increases due to increased platform dependency |
| **Drivers / Safety Escorts** | Converts idle time into revenue-generating time for increased overall income / Minimizes emotional labor by eliminating direct parent contact | Increased workload intensity from tightly scheduled AI dispatch / Psychological surveillance pressure from continuous AI monitoring |
| **Platform Operator** | High-frequency weekday service enables sustainable subscription economy model / Scalability for data business based on private education logistics data | Catastrophic reputational damage and legal liability if a child safety incident occurs / Conflicts with Passenger Transport Services Act and regulatory risk |

### 3.2 Secondary Impact: Building a Systemic Safety Net Through Transparency

The platform's most powerful advantage goes beyond simple transportation cost reduction—it 'digitizes' the interior of children's school vehicles, which have remained a black box, thereby building a systemic safety net. By using vision AI cameras and smart mirrors inside vehicles to software-enforce verification of boarding/alighting and remaining occupants, the platform operates as a **digital compliance infrastructure** that makes regulatory violations structurally impossible.

---

## 4. Legal and Regulatory Requirements

### 4.1 Passenger Transport Services Act Compliance Strategy

Under current law, the prohibition on 'paid transportation' means that a platform purchasing buses in bulk under its own name and dispatching them to multiple academies carries significant legal risk. Per Supreme Court precedent, a charter bus operator that continuously picks up passengers on fixed routes and receives compensation is deemed to be operating a 'route passenger transport service' and is therefore unlawful.

> **Compliance Strategy:** The platform must remain in the role of 'contract intermediary,' designed as a legal mediation platform that facilitates real-time N:N electronic contracts between academy directors and charter bus operators within the system. It must adopt a pure Demand-Responsive Transport (DRT) contract structure.

### 4.2 Road Traffic Act Article 52 (School Bus Registration Requirements)

Mandatory requirements for all vehicles used for school commuting to operate legally:

- **Vehicle structure and markings:** Full yellow exterior paint, attachment of child protection signs
- **Insurance requirements:** Comprehensive insurance or mutual aid association enrollment capable of full compensation for traffic accident damages
- **Registration issue (the most significant challenge):** Vehicles must be registered under the name of the head of the children's educational institution, or the head of the institution must have entered into a direct transportation contract with a charter bus operator

> **Key point:** Under current legal interpretation, a third-party platform operator purchasing buses in bulk under its own name and dispatching them is illegal. The platform must be designed as a legal mediation platform that facilitates and documents real-time N:N electronic contracts between academy directors and charter bus operators.

### 4.3 Compliance with the Se-rim Act (Safety Enhancement Act)

The core requirement of the Se-rim Act—mandatory presence of a riding safety escort—must be strictly observed. The platform must include not only driver assignment but also real-time matching of 'short-term riding safety escort part-timers,' and must integrate a **gig economy model** that matches local homemakers or senior workers as riding safety escorts.

### 4.4 Regulatory Sandbox (ICT Demonstration Special Case) Strategy

There is precedent: competitor 'SchoolBus Co., Ltd.' passed the Ministry of Science and ICT's ICT Regulatory Sandbox review and was approved for a demonstration special case. Upon approval, a provisional permit of 2 years (extendable up to 4 years) is granted.

> **Required action:** A dedicated legal team must be established simultaneously with the commencement of platform development to file for a demonstration special case with the Ministry of Science and ICT based on simulated data.

---

## 5. System Architecture Design

### 5.1 Cloud-Edge Computing Hybrid Architecture

The safety monitoring system, which is directly linked to children's lives, must operate unconditionally even in tunnels or dead zones with no internet connectivity. A cloud-centric approach that transmits all video data to a central server for analysis must **never be used** due to bandwidth overload and latency.

| Layer | Role | Core Technology |
|---|---|---|
| **Edge Layer** | Real-time analysis of in-vehicle CCTV footage, abnormal behavior detection, remaining occupant detection, facial recognition | NVIDIA Jetson Nano, YOLOv4/v8, DeepSort, MediaPipe, FaceNet |
| **Cloud Layer** | Receipt of abnormal behavior text logs and alert events, push notification relay, dispatch optimization engine | Firebase Realtime DB, Kubernetes Auto-scaling, VRP-TW algorithm |
| **Frontend Layer** | Separate interfaces for parents/drivers/academies, real-time integration | React Native (Mobile), React.js (Web Dashboard), WebSocket |

### 5.2 Data Flow Summary

```
[In-vehicle CCTV] → [Edge Device: Deep Learning Inference] → [Alert Event Generated on Anomaly Detection]
                                                                        ↓
                                                          [Firebase Realtime DB]
                                                                        ↓
                                            [Driver App Alert] + [Parent App Alert] + [Control Dashboard]
```

---

## 6. AI Feature Detailed Requirements

### 6.1 Intelligent In-Vehicle Abnormal Behavior and Remaining Occupant Monitoring

| Item | Specification Details |
|---|---|
| **Recommended Tech Stack** | YOLOv4/YOLOv8 (object detection) + DeepSort (object tracking) + MediaPipe (pose recognition) |
| **Real-time Behavior Recognition** | Real-time analysis of wide-angle ceiling camera footage to immediately detect abnormal behaviors such as children standing up and moving around, falling, or violence (fighting) |
| **Remaining Occupant Detection** | Precise detection of children remaining in seats or blind spots on the floor even after the bus engine is turned off, using object tracking technology |
| **Alert Dispatch Logic** | Upon detection, edge device changes the `abnormal_behavior` flag in Firebase Realtime DB → immediate siren alert dispatched to driver dashboard and control server |

### 6.2 Safe Boarding/Alighting and Missed-Pickup Prevention Facial Recognition System

| Item | Specification Details |
|---|---|
| **Recommended Tech Stack** | ResNet / FaceNet (deep learning-based facial recognition) + Anti-spoofing |
| **Contactless Biometric Authentication** | User authentication by face alone via smart mirror/tablet at vehicle door, automatically cross-referenced against boarding list |
| **Parent Notification Integration** | Immediate dispatch of "Student OOO has boarded" notification. Fundamentally prevents missed drop-offs and pick-ups |
| **Recognition Rate Requirement** | Minimum **95% recognition rate** even when wearing a mask or hat |

### 6.3 Active Blind Spot Safety Detection for Vehicle Front and Rear

| Item | Specification Details |
|---|---|
| **Recommended Tech Stack** | Computer vision analysis + ultrasonic and LiDAR proximity sensor fusion |
| **External Pedestrian Tracking** | Detection of children in blind spots at the front bumper underside and rear of the vehicle |
| **Safe Distance Determination** | Monitoring to confirm that alighted students have fully cleared the danger radius around the vehicle's wheels to a safe distance |
| **Forced Warning** | Forced visual warning triggered upon gear engagement when safety is not confirmed, preventing blind spot departure accidents |

### 6.4 Multi-Stop Route (Dispatch) Optimization AI

| Item | Specification Details |
|---|---|
| **Recommended Algorithm** | Metaheuristic algorithm + VRP-TW (Vehicle Routing Problem with Time Windows) |
| **Dynamic Route Optimization** | Calculates the optimal dispatch route for minimum travel time and fuel consumption daily, using pickup/drop-off points from multiple academies, academy-specific required arrival time windows by day of week, and vehicle capacity as variables |
| **Cross-Boarding Optimization** | Cross-boarding students from Academy A and Academy B to dramatically reduce empty vehicle rates and maximize network effects |

---

## 7. Frontend UI/UX Feature Specification

### 7.1 Parent Application (Parent App)

| Feature Name | Detailed Specification |
|---|---|
| **Real-time Location Tracking** | Visualization of second-by-second predictive information such as "Currently 2 stops away, estimated arrival in 4 minutes" by fusing AI routing data with GPS |
| **Safety Authentication Notifications** | Accurate boarding/alighting location and time logs recorded on the app's main screen, linked to facial recognition / beacon authentication |
| **One-Touch Schedule Cancellation** | Instantly reflected in the academy control center and driver AI routing navigation with a single button tap; automatic skip of that stop |
| **Simple Payment System** | Automated recurring credit card payment on a monthly subscription or usage-based deduction model |

### 7.2 Driver and Safety Escort Application (Driver & Guardian App)

| Feature Name | Detailed Specification |
|---|---|
| **AI Dynamic Navigation** | Today's route as determined by the AI optimization server is enforced as waypoint-based guidance. Real-time route recalculation upon traffic congestion or boarding cancellations |
| **Digital Boarding Management Roster** | Popup list of student names and profile photos for boarding/alighting at each stop |
| **Emergency Override Alarm** | Red flashing alert at the top of the smartphone screen + audible warning upon anomaly detection by the edge computer |

### 7.3 Academy and Administrator Web Dashboard (Admin Dashboard)

| Feature Name | Detailed Specification |
|---|---|
| **Student and Scheduler** | Weekly schedule and student database via bulk Excel upload or API integration with existing CRM |
| **Automated Billing and Settlement** | Automatic invoice generation based on monthly operation count, per-student boarding rate, and distance-weighted calculation |
| **Legal Documentation Archive** | Built-in validity tracking and renewal reminders for police registration certificates, comprehensive insurance certificates, safety training completion certificates, etc. |

---

## 8. Non-Functional Requirements

### 8.1 Privacy Protection and Data Security

Since the service targets children under 14, the legal guardian consent process required under the Personal Information Protection Act must be implemented at the app registration stage. Biometric images for facial recognition and in-vehicle CCTV footage databases require **AES-256** level encryption, and must be loaded only transiently into inference memory for analysis and immediately discarded (deleted) or de-identified.

### 8.2 High Availability and Traffic Scaling

Children's shuttle operations exhibit extreme traffic spike characteristics concentrated between 1:00 PM and 6:00 PM. A database bottleneck during this period causing the location tracking or notification servers to go down could directly lead to critical incidents such as missing children. Autoscaling infrastructure using **Kubernetes** or equivalent is essential.

### 8.3 Performance Requirements Summary

| Item | Target | Notes |
|---|---|---|
| Edge AI inference latency | **≤ 200ms** | Guarantees real-time abnormal behavior detection |
| Facial recognition success rate | **≥ 95%** | Including when wearing masks or hats |
| Push notification delivery time | **≤ 3 seconds** | From event occurrence to parent receipt |
| System availability (SLA) | **≥ 99.95%** | Based on peak hours 1–6 PM |
| Dispatch optimization engine response time | **≤ 30 seconds** | For real-time route recalculation |
| Concurrent vehicles handled | **500 initially, expandable to 5,000** | Based on Kubernetes autoscaling |

---

## 9. Development Roadmap and Phase Milestones

| Phase | Duration | Core Tasks | Deliverables | Notes |
|---|---|---|---|---|
| **Phase 0** | M1–M3 (3 months) | Regulatory sandbox application preparation / Legal team formation / Simulated data design | ICT demonstration special case application | Highest priority, concurrent |
| **Phase 1** | M1–M6 (6 months) | Edge AI prototype / Facial recognition PoC / Basic backend API design | AI PoC demo / API v0.1 | Edge device selection |
| **Phase 2** | M4–M10 (7 months) | VRP-TW dispatch engine / Mobile app development / Payment system integration / Web dashboard | App beta / Dashboard v1.0 | Recruit pilot academies |
| **Phase 3** | M10–M14 (5 months) | Pilot operation (focused on 1 district) / QA and security audit / User feedback integration | Pilot report / v1.1 patch | Meet demonstration special case conditions |
| **Phase 4** | M14–M18 (5 months) | Commercial launch / Multi-region expansion / Gig economy escort matching launch | App v2.0 official release | Execute GTM strategy |

---

## 10. Conclusion and Strategic Recommendations

The SAFEWAY KIDS platform holds overwhelming potential to fundamentally reshape the fragmented and inefficient Korean children's private education mobility market. The key success factors derived from this specification can be summarized in three points.

**First, a regulatory sandbox breakthrough strategy.** Securing ICT Demonstration Special Case status from the Ministry of Science and ICT or the Ministry of Land, Infrastructure and Transport to preemptively capture up to 4 years of an exclusive regulatory grace market is the lifeblood of the early business.

**Second, edge computing-based zero-latency AI safety detection architecture.** The system using YOLOv4/v8 and DeepSort for abnormal behavior and remaining occupant detection, and smart mirror facial recognition to fundamentally prevent missed boardings and alightings, is the platform's core technical differentiator.

**Third, multi-stop optimized dispatch algorithm.** Achieving near-perfect unit economics approaching a 0% empty vehicle rate through the VRP-TW-based dispatch optimization engine, and maximizing network effects, is the key to mid-to-long-term growth.

By perfectly executing on all three pillars—regulatory breakthrough, technical differentiation, and two-sided market network effects—SAFEWAY KIDS has the potential to grow into an overwhelming market leader that fundamentally reshapes the Korean children's school commute market.

---

*— End of Document —*
