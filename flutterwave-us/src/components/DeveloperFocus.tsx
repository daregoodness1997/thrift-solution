import { useState } from "react";
import { Terminal, Copy, Check, Play, Cpu, ArrowUpRight, Code, RefreshCw } from "lucide-react";
import { CodeLanguage, CodeSample } from "../types";

const CODE_SAMPLES: CodeSample[] = [
  {
    language: "curl",
    title: "Terminal / curl",
    code: `curl --request POST \\
  --url https://api.flutterwave.com/v3/payments \\
  --header 'Authorization: Bearer FLWSECK_TEST-XXXXXX-X' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "tx_ref": "SAAS-US-9831",
    "amount": "150.00",
    "currency": "USD",
    "redirect_url": "https://us-saas.com/checkout/callback",
    "customer": {
      "email": "customer@lagos.com",
      "name": "Adebayo Alabi"
    },
    "customizations": {
      "title": "US SaaS Payment",
      "logo": "https://us-saas.com/logo.png"
    }
  }'`,
    response: `{
  "status": "success",
  "message": "Hosted Link Created",
  "data": {
    "link": "https://checkout.flutterwave.com/v3/hosted/pay/41a29b38c03e",
    "tx_ref": "SAAS-US-9831",
    "currency": "USD",
    "amount": 150.00,
    "charge_amount": 150.00,
    "created_at": "2026-07-14T17:35:00.000Z"
  }
}`
  },
  {
    language: "nodejs",
    title: "Node.js SDK",
    code: `const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

const initializePayment = async () => {
  try {
    const response = await flw.Payment.initialize({
      tx_ref: "SAAS-US-9831",
      amount: "150.00",
      currency: "USD",
      redirect_url: "https://us-saas.com/checkout/callback",
      customer: {
        email: "customer@lagos.com",
        name: "Adebayo Alabi"
      }
    });
    console.log(response);
  } catch (error) {
    console.log(error);
  }
};`,
    response: `{
  "status": "success",
  "message": "Payment initialized",
  "data": {
    "link": "https://checkout.flutterwave.com/v3/hosted/pay/41a29b38c03e",
    "tx_ref": "SAAS-US-9831"
  }
}`
  },
  {
    language: "python",
    title: "Python SDK",
    code: `import requests

url = "https://api.flutterwave.com/v3/payments"
headers = {
    "Authorization": "Bearer FLWSECK_TEST-XXXXXX-X",
    "Content-Type": "application/json"
}
payload = {
    "tx_ref": "SAAS-US-9831",
    "amount": "150.00",
    "currency": "USD",
    "redirect_url": "https://us-saas.com/checkout/callback",
    "customer": {
        "email": "customer@lagos.com",
        "name": "Adebayo Alabi"
    }
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    response: `{
  "status": "success",
  "data": {
    "link": "https://checkout.flutterwave.com/v3/hosted/pay/41a29b38c03e"
  }
}`
  },
  {
    language: "php",
    title: "PHP SDK",
    code: `<?php
$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.flutterwave.com/v3/payments",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => json_encode([
    "tx_ref" => "SAAS-US-9831",
    "amount" => "150.00",
    "currency" => "USD"
  ]),
  CURLOPT_HTTPHEADER => array(
    "Authorization: Bearer FLWSECK_TEST-XXXXXX-X",
    "Content-Type: application/json"
  ),
));

$response = curl_exec($curl);
echo $response;`,
    response: `{"status":"success","message":"Hosted link generated","data":{"link":"https:\\/\\/checkout.flutterwave.com\\/v3\\/pay"}}`
  }
];

export default function DeveloperFocus() {
  const [activeTab, setActiveTab] = useState<CodeLanguage>("curl");
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [apiResponse, setApiResponse] = useState<string>("");

  const sample = CODE_SAMPLES.find(s => s.language === activeTab) || CODE_SAMPLES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(sample.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunRequest = () => {
    setIsRunning(true);
    setRunLogs(["[system] Resolving api.flutterwave.com...", "[system] TLS handshake established."]);
    setApiResponse("");

    setTimeout(() => {
      setRunLogs(prev => [...prev, "[auth] Authenticating bearer authorization credentials..."]);
    }, 600);

    setTimeout(() => {
      setRunLogs(prev => [...prev, `[request] POST /v3/payments (tx_ref: SAAS-US-9831)`]);
    }, 1200);

    setTimeout(() => {
      setRunLogs(prev => [...prev, "[response] 200 OK - Settle-bridge token issued successfully."]);
      setApiResponse(sample.response);
      setIsRunning(false);
    }, 2000);
  };

  return (
    <section id="developer-section" className="py-20 bg-slate-950 text-white scroll-mt-20 text-left">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Intro Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          <div className="lg:col-span-6">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              For Engineers, by Engineers
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight mt-4 leading-tight">
              An elegant integration, <br className="hidden sm:block" />
              boundless possibilities
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mt-4">
              Integrate the checkout engine in minutes using our lightweight SDKs or direct REST architectures. Built with compliance, security, and developer clarity at its absolute core.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-slate-900/40 p-4 rounded-xl border border-gray-800">
                <span className="text-brand-primary font-mono font-bold text-xs">V3 API ENDPOINTS</span>
                <p className="text-gray-300 font-bold text-sm mt-1">RESTful & JSON Ready</p>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-xl border border-gray-800">
                <span className="text-brand-primary font-mono font-bold text-xs">WEBHOOKS DEPLOYED</span>
                <p className="text-gray-300 font-bold text-sm mt-1">Real-time callbacks</p>
              </div>
            </div>
          </div>

          {/* Code Tabs switcher */}
          <div className="lg:col-span-6 bg-slate-900/60 rounded-2xl p-2 border border-gray-800 flex gap-1.5 flex-wrap">
            {CODE_SAMPLES.map(sampleItem => (
              <button
                key={sampleItem.language}
                onClick={() => {
                  setActiveTab(sampleItem.language);
                  setApiResponse("");
                  setRunLogs([]);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === sampleItem.language
                    ? "bg-brand-accent text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {sampleItem.title}
              </button>
            ))}
          </div>
        </div>

        {/* Code Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Code Snippet Block */}
          <div className="lg:col-span-7 bg-[#0E131F] rounded-3xl border border-gray-800 shadow-2xl p-6 flex flex-col justify-between min-h-[420px] relative overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-gray-800 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Code className="w-4 h-4 text-brand-primary" />
                <span>payment_initialize.{activeTab === "php" ? "php" : activeTab === "python" ? "py" : activeTab === "nodejs" ? "js" : "sh"}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
                  title="Copy Code"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleRunRequest}
                  disabled={isRunning}
                  className="bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition-all shadow shadow-brand-accent/30"
                >
                  <Play className="w-3 h-3 fill-white" /> Run Request
                </button>
              </div>
            </div>

            {/* Code Textarea */}
            <div className="flex-grow font-mono text-[11px] sm:text-xs text-slate-300 overflow-x-auto whitespace-pre leading-relaxed py-2 no-scrollbar">
              {sample.code}
            </div>

            {/* Bottom Tag */}
            <div className="pt-4 border-t border-gray-800 text-[10px] text-gray-500 flex justify-between items-center font-mono">
              <span>SECURED AUTHORIZATION: BEARER TOKEN</span>
              <span>API VERSION: V3</span>
            </div>
          </div>

          {/* Right: API Response Terminal Console */}
          <div className="lg:col-span-5 bg-black rounded-3xl border border-gray-800 p-6 flex flex-col justify-between min-h-[420px] relative font-mono text-left">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-900 mb-4">
                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-brand-primary" /> SANDBOX TERMINAL
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-900 text-green-400 border border-gray-800">
                  ONLINE
                </span>
              </div>

              {/* Logs Stream */}
              <div className="space-y-1.5 mb-4 max-h-[140px] overflow-y-auto no-scrollbar text-[10px]">
                {runLogs.length === 0 ? (
                  <span className="text-gray-600 italic">Click "Run Request" in the editor to trigger a live mock REST transaction.</span>
                ) : (
                  runLogs.map((log, lidx) => (
                    <div key={lidx} className={`${
                      log.startsWith("[system]") ? "text-blue-400" :
                      log.startsWith("[auth]") ? "text-yellow-500" :
                      log.startsWith("[request]") ? "text-purple-400" :
                      "text-green-400"
                    }`}>
                      {log}
                    </div>
                  ))
                )}
                {isRunning && <span className="inline-block w-1.5 h-3.5 bg-brand-primary animate-pulse ml-1"></span>}
              </div>
            </div>

            {/* Simulated Response */}
            <div className="flex-grow bg-slate-950/80 border border-gray-900 rounded-xl p-4 overflow-y-auto max-h-[180px] no-scrollbar text-[10px] text-gray-300 whitespace-pre">
              {apiResponse ? (
                apiResponse
              ) : (
                <div className="h-full flex items-center justify-center text-gray-700 italic">
                  RESPONSE OBJECT CONTAINER
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-gray-900 flex justify-between items-center text-[9px] text-gray-600">
              <span>LATENCY: {isRunning ? "..." : apiResponse ? "48ms" : "0ms"}</span>
              <span>HOST: api.flutterwave.com</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
