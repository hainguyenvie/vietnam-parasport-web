"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, UserCheck, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useTranslation';
import { useSession } from 'next-auth/react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

const translations: Record<string, Record<string, string>> = {
  vi: {
    tabChatbot: "Trợ lý AI",
    tabChatbotDesc: "Gợi ý kịch bản & caption",
    quickPromptHeading: "💡 Chọn nhanh câu hỏi gợi ý:",
    chatbotInputPlaceholder: "Nhập câu hỏi của bạn tại đây...",
    chatbotSendBtn: "Gửi tin nhắn",
    botGreeting: "Xin chào! Tôi là Trợ lý AI của Creator Lab. Tôi có thể giúp bạn lên ý tưởng, viết kịch bản video, biên soạn caption và kiểm tra xem nội dung của bạn có bị mắc lỗi \"thương hại hóa\" hay không. Hãy chọn câu hỏi gợi ý bên dưới hoặc nhắn trực tiếp cho tôi nhé!",
    botGreetingTime: "Vừa xong",
    botResponseTime: "Vừa xong",
    botTyping: "Trợ lý AI đang soạn câu trả lời...",
    loadingResponse: "Đang gửi..."
  },
  en: {
    tabChatbot: "AI Assistant",
    tabChatbotDesc: "Script & caption suggestions",
    quickPromptHeading: "💡 Choose a quick question prompt:",
    chatbotInputPlaceholder: "Type your question here...",
    chatbotSendBtn: "Send Message",
    botGreeting: "Hello! I am your Creator Lab AI Assistant. I can help you brainstorm video ideas, write scripts, draft captions, and review whether your content contains any \"pity-oriented\" tone. Select a prompt below or chat with me directly!",
    botGreetingTime: "Just now",
    botResponseTime: "Just now",
    botTyping: "AI Assistant is typing...",
    loadingResponse: "Sending..."
  }
};

function getPersonalizedGreeting(session: any, language: string, defaultGreeting: string): string {
  const isVi = language === "vi";
  if (!session?.user) return defaultGreeting;
  const name = session.user.name || (isVi ? "bạn" : "there");
  const role = (session.user as any).role;

  if (role === 'ATHLETE') {
    return isVi
      ? `Xin chào Vận động viên ${name}! Chúc bạn một ngày tập luyện và thi đấu tràn đầy năng lượng. Tôi là Trợ lý AI của Creator Lab, sẵn sàng đồng hành cùng bạn để chia sẻ những thành tích, kịch bản tập luyện, câu chuyện thể thao chân thực và truyền cảm hứng nhất của mình mà không bị mắc lỗi "thương hại hóa". Hãy chọn câu hỏi gợi ý bên dưới hoặc nhắn trực tiếp cho tôi nhé!`
      : `Hello Athlete ${name}! Wishing you a high-energy day of training and competition. I am your Creator Lab AI Assistant, ready to help you share your achievements, training scripts, and authentic, inspiring sports stories without pity-oriented tones. Select a prompt below or chat with me directly!`;
  }
  if (role === 'COACH') {
    return isVi
      ? `Xin chào Huấn luyện viên ${name}! Cảm ơn thầy/cô đã luôn sát cánh cùng các vận động viên. Tôi là Trợ lý AI của Creator Lab, sẵn sàng hỗ trợ thầy/cô viết giáo án truyền thông, chia sẻ kinh nghiệm huấn luyện chuyên nghiệp và xây dựng hình ảnh tích cực cho đội tuyển. Hãy chọn câu hỏi gợi ý bên dưới hoặc nhắn trực tiếp cho tôi nhé!`
      : `Hello Coach ${name}! Thank you for always guiding our athletes. I am your Creator Lab AI Assistant, here to help you write media plans, share professional coaching insights, and build a positive image for the team. Select a prompt below or chat with me directly!`;
  }
  if (role === 'ASSISTANT') {
    return isVi
      ? `Xin chào Người hỗ trợ ${name}! Vai trò đồng hành của bạn vô cùng quan trọng đối với các vận động viên. Tôi là Trợ lý AI của Creator Lab, sẵn sàng giúp bạn biên soạn caption đồng hành, lên ý tưởng kịch bản hậu trường ý nghĩa và tôn trọng. Hãy chọn câu hỏi gợi ý bên dưới hoặc nhắn trực tiếp cho tôi nhé!`
      : `Hello Supporter ${name}! Your companion role is crucial to our athletes. I am your Creator Lab AI Assistant, ready to help you write companion captions and brainstorm meaningful, respectful behind-the-scenes video ideas. Select a prompt below or chat with me directly!`;
  }
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return isVi
      ? `Xin chào Quản trị viên ${name}! Tôi là Trợ lý AI của Creator Lab. Tôi có thể giúp bạn soạn thông báo, viết bài hướng dẫn và kiểm duyệt nội dung theo tiêu chuẩn truyền thông không rào cản. Hãy chọn câu hỏi gợi ý bên dưới hoặc nhắn trực tiếp cho tôi nhé!`
      : `Hello Administrator ${name}! I am your Creator Lab AI Assistant. I can help you draft announcements, write guidelines, and moderate content based on barrier-free media standards. Select a prompt below or chat with me directly!`;
  }
  return isVi
    ? `Xin chào ${name}! Tôi là Trợ lý AI của Creator Lab. Tôi có thể giúp bạn tìm hiểu về thể thao khuyết tật, lên ý tưởng, viết kịch bản video và biên soạn caption theo tinh thần tôn trọng, tích cực. Hãy chọn câu hỏi gợi ý bên dưới hoặc nhắn trực tiếp cho tôi nhé!`
    : `Hello ${name}! I am your Creator Lab AI Assistant. I can help you learn about Paralympic sports, brainstorm ideas, write scripts, and draft captions in a respectful, positive spirit. Select a prompt below or chat with me directly!`;
}

function getBotResponse(input: string, language: string, role?: string): string {
  const text = input.toLowerCase();
  const isVi = language === "vi";

  const pityWords = isVi
    ? ['đáng thương', 'vượt lên số phận', 'tội nghiệp', 'bất hạnh', 'dù khuyết tật', 'mặc cảm']
    : ['pity', 'poor', 'sad story', 'disabled but', 'misfortune', 'pitying', 'suffering'];
  const foundPity = pityWords.filter(word => text.includes(word));

  if (foundPity.length > 0) {
    return isVi
      ? `⚠️ **Cảnh báo từ Creator Lab:** Caption của bạn có chứa các từ ngữ mang chiều hướng thương hại hóa: **"${foundPity.join(', ')}"**.\n\n👉 **Gợi ý chỉnh sửa:**\nThay vì dùng các cụm từ bi kịch hóa, hãy tập trung vào năng lực thể thao và sự tự tin. Ví dụ:\n- Tránh: *"Dù khuyết tật nhưng tôi vẫn cố gắng"* \n- Hãy viết: *"Tôi tập trung hết mình vào giáo án tập luyện của huấn luyện viên để cải thiện thành tích cá nhân."*\n\nBạn có muốn tôi giúp viết lại một bản nháp tôn trọng hơn không?`
      : `⚠️ **Creator Lab Warning:** Your caption contains pity-oriented words or phrases: **"${foundPity.join(', ')}"**.\n\n👉 **Suggested Edit:**\nInstead of dramatic tragedy words, focus on athletic capabilities and confidence. For example:\n- Avoid: *"Although disabled, I still try my best"*\n- Instead, write: *"I focus entirely on my coach's training regimen to improve my personal performance."*\n\nWould you like me to help you rewrite a more respectful draft?`;
  }

  if (text.includes('giới thiệu') || text.includes('bio') || text.includes('intro') || text.includes('self')) {
    return isVi
      ? `📝 **Gợi ý viết Caption giới thiệu bản thân:**\n\n**Cấu trúc 3 phần chuyên nghiệp:**\n1. **Lời chào & Môn thi đấu:** *"Xin chào mọi người! Mình là [Tên], vận động viên môn [Tên môn] tại [CLB/Tỉnh thành]."* \n2. **Thành tích nổi bật hoặc Động lực:** *"Bộ môn này đã mang lại cho mình nhiều trải nghiệm quý giá. Mỗi buổi tập là một cơ hội vượt qua giới hạn của bản thân."* \n3. **Lời kêu gọi và Hashtag:** *"Cùng theo dõi và cổ vũ hành trình chinh phục các giải đấu sắp tới của mình nhé! 🇻🇳 #VĐVVietnam #TheThaoKhongRaoCan #AthleteLife"*`
      : `📝 **Self Introduction Caption:**\n\n**Professional 3-Part Structure:**\n1. **Greeting & Sport:** *"Hi everyone! I am [Name], competing in [Sport Name] representing [Club/Region]."* \n2. **Achievements/Motivation:** *"This sport has given me valuable experiences. Every training session is an opportunity to push past my limits."* \n3. **Call to Action & Hashtags:** *"Follow and support my journey towards upcoming tournaments! 🇻🇳 #VietnamAthlete #SportsWithoutBarriers #AthleteLife"`;
  }

  if (text.includes('video') || text.includes('hành trình') || text.includes('journey')) {
    return isVi
      ? `🎬 **Kịch bản Video ngắn (30-45s) - Một ngày tập luyện:**\n\n- **[0s - 10s] (Mở đầu cuốn hút):** Cảnh quay cận cảnh bạn khởi động, chuẩn bị dụng cụ.\n- **[10s - 30s] (Nội dung chính):** Cảnh tập các bài kỹ thuật, nỗ lực thực hiện động tác khó.\n- **[30s - 45s] (Kết thúc):** Bạn cười tươi vẫy tay chào.\n\n*Lời thoại:* "Cảm ơn các bạn đã theo dõi! Hãy bấm theo dõi để đồng hành cùng hành trình của mình nhé!"`
      : `🎬 **Short Video Script (30-45s) - Training Day:**\n\n- **[0s - 10s] (Hook):** Close-up shot of you preparing equipment.\n- **[10s - 30s] (Body):** Footage of technical exercises with focus.\n- **[30s - 45s] (Outro):** Smiling, waving at the camera.\n\n*Voiceover:* "Thanks for watching! Click follow to support my journey!"`;
  }

  if (text.includes('ý tưởng') || text.includes('ideas') || text.includes('idea')) {
    return isVi
      ? `💡 **5 Ý tưởng nội dung đầy cảm hứng:**\n\n1. **Giới thiệu trang bị thi đấu:** Quay/viết về dụng cụ thể thao của bạn.\n2. **Phân tích một kỹ thuật:** Hướng dẫn cách thực hiện một động tác khó.\n3. **Trước và sau buổi tập:** So sánh trạng thái trước và sau khi hoàn thành giáo án.\n4. **Trực tiếp trả lời Q&A:** Giải đáp câu hỏi thú vị của khán giả.\n5. **Khoảnh khắc tự hào:** Chia sẻ lại một tấm ảnh nhận huy chương hoặc vượt qua kỷ lục cá nhân.`
      : `💡 **5 Inspiring Content Ideas:**\n\n1. **Introduce your gear:** Showcase your sports equipment.\n2. **Deconstruct a technique:** Show how you perform a specific technique.\n3. **Before & After workout:** Compare your state before and after training.\n4. **Q&A Session:** Answer popular questions from viewers.\n5. **Proud Milestone:** Share a photo of winning a medal or beating a personal record.`;
  }

  if (text.includes('tuần') || text.includes('week')) {
    return isVi
      ? `📅 **Lịch biên tập mẫu cho tuần này (3 bài đăng):**\n\n- **Thứ 2 (Bài viết dạng ảnh):** Chia sẻ ảnh chân dung tập luyện kèm lời nhắn khởi động tuần mới.\n- **Thứ 4 (Video ngắn):** Video ghi lại 1 động tác kỹ thuật bạn đang tối ưu hóa.\n- **Thứ 7 (Bài viết tự sự):** Chia sẻ lý do bạn yêu thích môn thể thao này.`
      : `📅 **Sample Content Calendar for This Week (3 Posts):**\n\n- **Monday (Image post):** Share a training portrait with a message to start the week.\n- **Wednesday (Short video):** A video showing 1 specific technical movement.\n- **Saturday (Written reflection):** Share why you love this sport.`;
  }

  if (text.includes('kiểm tra') || text.includes('check')) {
    return isVi
      ? `🔍 **Trình kiểm tra nội dung:** Bạn hãy gửi đoạn Caption bạn dự định đăng vào đây. Tôi sẽ rà soát kỹ lưỡng các từ ngữ để đảm bảo tinh thần tôn trọng, tích cực và không có yếu tố thương hại hóa.`
      : `🔍 **Content checker:** Please paste your planned caption here. I will carefully scan the words to ensure a respectful, positive spirit with no pity-based elements.`;
  }

  return isVi
    ? `🤖 **Trợ lý AI:** Cảm ơn bạn đã chia sẻ! Để hỗ trợ tốt nhất cho bạn về xây dựng kênh truyền thông hoặc viết kịch bản thể thao, bạn có thể mô tả chi tiết hơn về bộ môn bạn đang tập luyện và ý định truyền tải thông điệp được không? Tôi luôn sẵn sàng hỗ trợ bạn theo tinh thần "Thể thao không rào cản"!`
    : `🤖 **AI Assistant:** Thank you for sharing! To best help you build a media channel or write a sports script, could you describe in more detail the sport you are training and the message you want to convey? I am always ready to support you in the spirit of "Sports Without Barriers"!`;
}

export default function AiAssistant() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const tStr = translations[language] || translations.vi;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [botLoading, setBotLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = language === 'vi'
    ? [
        'Tôi muốn viết caption giới thiệu bản thân.',
        'Tôi muốn làm video đầu tiên về hành trình thể thao của mình.',
        'Hãy gợi ý cho tôi 5 ý tưởng bài đăng.',
        'Kiểm tra giúp tôi caption này có phù hợp không.',
        'Tôi nên đăng nội dung gì trong tuần này?'
      ]
    : [
        'I want to write a self-introduction caption.',
        'I want to make my first video about my sports journey.',
        'Suggest 5 content ideas for my page.',
        'Help check if this caption is appropriate.',
        'What should I post this week?'
      ];

  useEffect(() => {
    setMessages([{
      sender: 'bot',
      text: getPersonalizedGreeting(session, language, tStr.botGreeting),
      time: tStr.botGreetingTime
    }]);
  }, [language, session]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, botLoading]);

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;
    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setBotLoading(true);
    setTimeout(() => {
      const role = (session?.user as any)?.role;
      const botMsg: Message = {
        sender: 'bot',
        text: getBotResponse(textToSend, language, role),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setBotLoading(false);
    }, 800);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-5 z-40 p-3 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-full shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-1 hover:scale-105"
        aria-label={tStr.tabChatbot}
      >
        <Bot size={20} />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl h-[85vh] max-h-[700px] bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/30">
                  <Bot size={20} className="text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{tStr.tabChatbot}</h3>
                  <p className="text-xs text-slate-500">{tStr.tabChatbotDesc}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${msg.sender === 'user' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'}`}>
                    {msg.sender === 'user' ? <UserCheck size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                    <div className={`p-4 text-sm leading-relaxed ${msg.sender === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-blue-500/20'
                      : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm shadow-sm'
                    }`}>
                      <div className="whitespace-pre-line break-words">{msg.text}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium px-1">{msg.time}</span>
                  </div>
                </div>
              ))}
              {botLoading && (
                <div className="flex items-end gap-3 flex-row">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                    <Bot size={16} />
                  </div>
                  <div className="flex flex-col items-start max-w-[80%]">
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150" />
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-1.5 font-medium">{tStr.botTyping}</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 bg-white/70 dark:bg-slate-900/60 border-t dark:border-slate-800 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5 uppercase tracking-wider">{tStr.quickPromptHeading}</span>
              <div className="flex gap-2 overflow-x-auto pb-1.5">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={botLoading}
                    className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/35 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 text-xs rounded-full border dark:border-slate-700/60 transition whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }}
              className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800/50 flex gap-3 items-center shrink-0"
            >
              <input
                type="text"
                value={userInput}
                disabled={botLoading}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={tStr.chatbotInputPlaceholder}
                className="flex-1 pl-5 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={botLoading || !userInput.trim()}
                className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-2xl transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 shrink-0"
                aria-label={tStr.chatbotSendBtn}
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
