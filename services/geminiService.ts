
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePlanFeasibility = async (title: string, description: string, startDate: string, endDate: string) => {
  try {
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `계획 "${title}: ${description}" (${startDate} ~ ${endDate})을 달성하기 위해 전체 기간을 5등분한 5개의 중간 목표(마일스톤)를 제안해주세요.
      
      필수 조건:
      1. 반드시 정확히 5개의 항목이어야 합니다.
      2. 전체 기간을 5등분하여 시간 순서대로 배치해주세요.
      3. 목표 제목은 한국어로 명확하게 작성해주세요.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "마일스톤 제목 (한국어)" },
              dueDate: { type: Type.STRING, description: "마감일 (YYYY-MM-DD)" }
            },
            required: ["title", "dueDate"]
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) return [];
    const result = JSON.parse(text);
    
    // Enforce exactly 5 milestones
    if (Array.isArray(result)) {
       let milestones = result.slice(0, 5);
       // Fill if less than 5 (fallback)
       while (milestones.length < 5) {
         milestones.push({
           title: "추가 목표 설정 필요",
           dueDate: endDate
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
