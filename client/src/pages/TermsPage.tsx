export default function TermsPage() {
  const termsContent = `# Terms & Conditions

**Last Updated:** [Date]

## 1. Platform Purpose

IdeaConnect is a platform designed to help individuals discover potential collaborators and share ideas. We provide a space for connection and communication, but we are not a party to any agreements or collaborations that may form between users.

## 2. User Responsibilities

By using IdeaConnect, you agree that:

- You are responsible for your own actions, communications, and content shared on the platform.
- You will not use the platform for any illegal, harmful, or fraudulent purposes.
- You will respect other users and their intellectual property.
- You are responsible for verifying the identity and credentials of potential collaborators.
- Any agreements, partnerships, or business relationships you form are entirely between you and other users.

## 3. Idea Ownership

- By default, idea owners retain all rights to their ideas.
- Posting an idea on IdeaConnect does not transfer any ownership rights to the platform or other users.
- Idea owners are responsible for protecting their intellectual property as they see fit.

## 4. No Legal Advice

IdeaConnect does not provide legal, financial, or business advice. The platform and its features (including any disclaimers or agreements) are for informational and connection purposes only. For any serious business or legal matters, please consult with qualified professionals.

## 5. Platform Limitations

- IdeaConnect is a connection platform only. We do not guarantee:
  - The accuracy of user-provided information
  - The success of any collaborations
  - The protection of your ideas beyond basic platform features
  - The behavior or intentions of other users

## 6. Content and Conduct

- You are responsible for all content you post on the platform.
- You must not post content that is illegal, defamatory, or violates others' rights.
- IdeaConnect reserves the right to remove content or suspend accounts that violate these terms.

## 7. Disclaimer of Warranties

IdeaConnect is provided "as is" without warranties of any kind. We do not guarantee the platform will be error-free, secure, or continuously available.

## 8. Limitation of Liability

IdeaConnect, its creators, and operators are not liable for:
- Any losses or damages resulting from use of the platform
- Disputes between users
- Intellectual property disputes
- Any consequences of collaborations formed through the platform

## 9. Changes to Terms

We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.

## 10. Contact

For questions about these terms, please contact us through the platform.

---

**Note:** This is a student/hackathon project. These terms are provided as a basic framework and are not intended as comprehensive legal documentation. For serious business use, consult with legal professionals.`;

  // Simple markdown to HTML converter for basic formatting
  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line, idx) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={idx} className="text-3xl font-bold text-gray-900 mt-8 mb-4">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={idx} className="text-2xl font-semibold text-gray-900 mt-6 mb-3">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={idx} className="text-xl font-semibold text-gray-900 mt-4 mb-2">{line.substring(4)}</h3>;
        }
        
        // Bold text
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={idx} className="font-semibold text-gray-900 mb-2">{line.replace(/\*\*/g, '')}</p>;
        }
        
        // List items
        if (line.trim().startsWith('- ')) {
          return <li key={idx} className="ml-6 mb-2 text-gray-700">{line.substring(2)}</li>;
        }
        
        // Horizontal rule
        if (line.trim() === '---') {
          return <hr key={idx} className="my-6 border-gray-300" />;
        }
        
        // Regular paragraphs
        if (line.trim()) {
          // Check if line contains bold text
          const parts = line.split(/(\*\*.*?\*\*)/g);
          if (parts.length > 1) {
            return (
              <p key={idx} className="mb-3 text-gray-700">
                {parts.map((part, pIdx) => 
                  part.startsWith('**') && part.endsWith('**') ? (
                    <strong key={pIdx}>{part.replace(/\*\*/g, '')}</strong>
                  ) : (
                    part
                  )
                )}
              </p>
            );
          }
          return <p key={idx} className="mb-3 text-gray-700">{line}</p>;
        }
        
        // Empty lines
        return <br key={idx} />;
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
          <div className="prose prose-sm sm:prose-lg max-w-none">
            <div className="space-y-2">
              {formatContent(termsContent)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

