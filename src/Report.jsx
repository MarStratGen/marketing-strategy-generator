export default function Report({ plan }) {
  if (!plan) return null; // form visible

  /* Success → pretty JSON */
  if (!plan.error) {
    return (
      <pre className="whitespace-pre-wrap text-xs mt-6 bg-gray-100 p-4 rounded">
        {JSON.stringify(plan, null, 2)}
      </pre>
    );
  }

  /* Error → show user-friendly message plus technical details */
  const errorMessage = typeof plan === 'object' ? JSON.stringify(plan, null, 2) : String(plan);
  
  // Extract user-friendly error message
  let userMessage = "An error occurred while generating your marketing plan.";
  if (plan.detail?.error?.message) {
    userMessage = `API Error: ${plan.detail.error.message}`;
  } else if (plan.error) {
    userMessage = `Error: ${plan.error}`;
  }
  
  return (
    <div className="mt-6">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {userMessage}
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
          Show technical details
        </summary>
        <pre className="whitespace-pre-wrap text-red-700 text-xs mt-2 bg-red-50 p-4 rounded">
          {errorMessage}
        </pre>
      </details>
    </div>
  );
}
