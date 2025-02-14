const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// DALL·E API 호출 함수
async function dalleTextToImage({ prompt }) {
    try {
        // OpenAI API 호출
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        if (!response.data || response.data.length === 0) {
            throw new Error("이미지 생성 실패: 응답이 없습니다.");
        }

        return response.data[0].url;
    } catch (error) {
        console.error("DALL·E 이미지 생성 오류:", error);

        // 🛑 결제 한도 초과 시 기본 이미지 반환
        if (error.code === "billing_hard_limit_reached") {
            return "https://via.placeholder.com/1024?text=OpenAI+Billing+Limit+Reached";
        }

        // 🛑 요청 속도 제한 초과 시 기본 이미지 반환
        if (error.code === "rate_limit_exceeded") {
            console.log("🚨 API 요청 속도 제한 초과 - 1분 후 다시 시도하세요.");
            return "https://via.placeholder.com/1024?text=API+Rate+Limit+Exceeded";
        }

        return "https://via.placeholder.com/1024?text=Image+Generation+Failed";
    }
}

module.exports = {
    dalle: { text2im: dalleTextToImage }
};
