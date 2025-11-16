// === PTKV3 - AI Chat (RAG local) ===
const RAG_API = "http://localhost:8000/ask";  // hoặc domain Cloudflare tunnel sau này

async function askAI(question){
  const res = await fetch(`${RAG_API}?q=${encodeURIComponent(question)}`);
  const data = await res.json();
  if(!data.ok) throw new Error("AI lỗi");
  return data.answer;
}

// Hàm xử lý khi người dùng gửi câu hỏi
async function handleAsk(){
  const input = document.querySelector("#ai-input");
  const q = input.value.trim();
  if(!q) return;
  addBubble("user", q);
  input.value = "";
  try{
    const answer = await askAI(q);
    addBubble("ai", answer);
  }catch(e){
    addBubble("ai", "Xin lỗi, hệ thống đang bận hoặc kết nối bị gián đoạn.");
  }
}
