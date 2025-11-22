
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
