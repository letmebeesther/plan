
import { GoogleGenAI, Type } from "@google/genai";
import { MilestoneAnalysis } from "../types";

// Removed global initialization to prevent crash if API_KEY is missing on load.
// Instead, we initialize inside each function within a try-catch block.

export const analyzePlanFeasibility = async (title: string, description: string, startDate: string, endDate: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `다음 계획의 실현 가능성을 한국어로 분석해주세요.
      제목: ${title}
      설명: ${description}
      기간: ${startDate} 부터 ${endDate} 까지
      
      격려하면서도 현실적인 평가를 한국어로 2문장 이내로 작성해주세요. 말투는 정중하고 도움이 되는 톤으로 해주세요.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return "AI 분석을 현재 이용할 수 없습니다. 잠시 후 다시 시도해주세요.";
  }
};

export const suggestMilestones = async (title: string, description: string, startDate: string, endDate: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `계획 "${title}: ${description}" (${startDate} ~ ${endDate})을 달성하기 위해 적절한 중간 목표(마일스톤)들을 제안해주세요.
      
      필수 조건:
      1. 최소 5개 이상의 항목이어야 합니다. 최대 50개까지 가능합니다.
      2. 계획의 기간(일수)과 복잡도를 고려하여 적절한 개수(보통 5~15개, 장기 계획은 더 많이)로 단계를 나눠주세요.
      3. 전체 기간을 시간 순서대로 배치해주세요.
      4. 목표 제목은 한국어로 명확하게 작성해주세요.
      5. 각 목표의 중요도(weight)를 1(낮음), 2(보통), 3(높음/핵심) 중에서 지정해주세요. 핵심적인 성취 단계는 3으로 설정하세요.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "마일스톤 제목 (한국어)" },
              dueDate: { type: Type.STRING, description: "마감일 (YYYY-MM-DD)" },
              weight: { type: Type.INTEGER, description: "중요도 (1: 낮음, 2: 보통, 3: 높음)" }
            },
            required: ["title", "dueDate", "weight"]
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) return [];
    const result = JSON.parse(text);
    
    // Ensure minimum 5 milestones
    if (Array.isArray(result)) {
       const milestones = [...result];
       
       // Fill if less than 5
       while (milestones.length < 5) {
         milestones.push({
           title: "추가 목표 설정 필요",
           dueDate: endDate,
           weight: 2
         });
       }
       return milestones;
    }
    return [];
  } catch (error) {
    console.error("Gemini milestone suggestion failed", error);
    return [];
  }
};

export const analyzeMilestoneAction = async (milestoneTitle: string): Promise<MilestoneAnalysis | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following goal sentence: "${milestoneTitle}"`,
      config: {
        systemInstruction: `You are an AI assistant specialized in analyzing user-created “middle goals” for a self-improvement app.
Your job is to understand the user’s goal sentence, classify the underlying action, and recommend the most reliable verification method using biometric data, sensors, official records, or digital logs.

Your output must ALWAYS be valid JSON. No extra text.

--------------------------------
🎯 TASK REQUIREMENTS
--------------------------------

Given a single natural-language goal sentence (Korean or English), generate a JSON object with the following fields:

1. "action_type" (string, MUST be one of):
   [
     "movement",         // 이동/장소 방문 중심
     "exercise",         // 운동/신체활동
     "eating",           // 식사/맛집/섭취
     "study",            // 공부/집중/독서
     "social",           // 사람과 상호작용
     "creative",         // 창작(그림/글쓰기/음악)
     "relaxation",       // 명상/힐링/쉼
     "experience",       // 새로운 경험/도전
     "official_record",  // 자격증/봉사/인턴/입시 등
     "unknown"           // 너무 추상적이거나 분류 불가
   ]

2. "action_tags" (array of short English keywords)
   - Example: ["market", "local_food", "friend", "reading", "running"]

3. "required_biometrics" (array, choose most relevant 0~4 from):
   [
     "heart_rate", 
     "hrv", 
     "gps", 
     "accelerometer", 
     "chewing", 
     "blood_glucose",
     "posture", 
     "eye_tracking", 
     "voice_interaction",
     "typing_pattern",
     "sleep_pattern",
     "none"   // ONLY for official_record or unknown cases
   ]

4. "recommended_evidence" (array, choose 1~3 from):
   [
     "biometric_log",         // wearable sensor logs (HR, HRV, chewing, glucose, etc.)
     "gps_log",               // location + dwell time
     "sensor_behavior_log",   // eye tracking, posture, chewing, accelerometer
     "digital_work_log",      // keyboard/mouse/pen/DAW usage logs
     "voice_ai_log",          // conversation/audio pattern logs
     "official_verification", // certificates, government or institution verification
     "not_applicable"
   ]

5. "notes" (Korean explanation, 1~3 sentences)
   - Why the biometrics/evidence were chosen
   - How this prevents cheating or manipulation


--------------------------------
🔍 DECISION RULES
--------------------------------

📌 STEP 1 — Classify action_type by meaning  
Use meaning, not keywords. Examples:

- movement → “시장 가보기”, “새로운 도시 걸어다니기”, “박물관 방문”
- exercise → 조깅, 달리기, 등산, 체력 훈련
- eating → 맛집 가기, 현지 음식 먹기, 노슈가 관련 목표
- study → 책 읽기, 공부, 코딩테스트 준비, 논문 읽기
- social → 친구 만들기, 대화, 네트워킹
- creative → 그림 그리기, 글쓰기, 악기 연습, 요리하기
- relaxation → 명상, 쉼, 감정 치유
- experience → 새로운 활동 체험, 도전, 모험
- official_record → 자격증, 봉사시간, 인턴십, 입시, 논문게재
- unknown → 문장 자체가 모호하거나 행동이 없음

📌 STEP 2 — Map to most reliable biometrics/sensors
- 이동/장소 → gps, accelerometer  
- 운동 → heart_rate, hrv, gps  
- 식사 → chewing, blood_glucose, gps  
- 공부/독서 → eye_tracking, posture, typing_pattern  
- 사회적 상호작용 → voice_interaction, camera behavior  
- 창작 → typing_pattern / digital work log  
- 힐링/명상 → hrv, heart_rate, posture  
- 공식기록 → none  
- unknown → none

📌 STEP 3 — Recommend evidence types
- movement → gps_log + biometric_log  
- exercise → biometric_log + gps_log  
- eating → gps_log + biometric_log + sensor_behavior_log  
- study → sensor_behavior_log + gps_log + digital_work_log  
- social → voice_ai_log + sensor_behavior_log  
- creative → digital_work_log  
- relaxation → biometric_log + sensor_behavior_log  
- experience → gps_log + biometric_log  
- official_record → official_verification  
- unknown → not_applicable

📌 STEP 4 — Output ONLY JSON  
If ambiguous, fallback to:
{
  "action_type": "unknown",
  "action_tags": [],
  "required_biometrics": ["none"],
  "recommended_evidence": ["not_applicable"],
  "notes": "목표 문장이 추상적이거나 행동을 판단할 수 없습니다."
}`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action_type: { type: Type.STRING },
            action_tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            required_biometrics: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommended_evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
            notes: { type: Type.STRING }
          },
          required: ["action_type", "action_tags", "required_biometrics", "recommended_evidence", "notes"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as MilestoneAnalysis;
  } catch (error) {
    console.error("Gemini milestone analysis failed", error);
    return null;
  }
};
