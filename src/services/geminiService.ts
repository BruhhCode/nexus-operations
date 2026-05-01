import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateOperationalReport(data: { tasks: any[], projects: any[], clients: any[], invoices: any[] }) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze the following enterprise operations data and provide a concise, high-performance executive summary for the CEO.
    The tone should be professional, precise, and systematic.
    
    Data:
    - Tasks: ${data.tasks.length} total (${data.tasks.filter(t => t.status === 'done').length} complete)
    - Projects: ${data.projects.length} active
    - Clients: ${data.clients.length} registered
    - Invoices: ${data.invoices.length} total ($${data.invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0)} collected)
    
    Format the output in a technical, markdown structure with sections for "MSR (Main Status Report)", "Risk Assessment", and "Strategic Recommendations".
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "REPORT_GENERATION_FAILED: Check security logs.";
  }
}
