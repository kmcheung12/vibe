(function(){"use strict";const a=typeof browser<"u"?browser:chrome;let o=null,f=!1;function w(){E(),a.runtime.onMessage.addListener((e,t,i)=>{if(e.action==="summarize"){const n=document.body.innerText;a.runtime.sendMessage({action:"summarize",text:n,tabId:e.tabId})}else e.action==="askJulian"?(d(),document.getElementById("julian-input").value=e.text,document.getElementById("julian-submit").click()):e.action==="generate"?(d(),document.getElementById("julian-input").value=e.text,document.getElementById("julian-generate").click()):e.action==="showResponse"?(d(),v(e.text,e.type)):e.action==="showError"&&(d(),T(e.error))})}function E(){if(o)return;o=document.createElement("div"),o.id="julian-sidebar",o.style.cssText=`
    position: fixed;
    top: 0;
    right: -400px;
    width: 380px;
    height: 100vh;
    background-color: #ffffff;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    transition: right 0.3s ease;
    display: flex;
    flex-direction: column;
    font-family: Arial, sans-serif;
  `;const e=document.createElement("div");e.style.cssText=`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: #4a55af;
    color: white;
  `;const t=document.createElement("h2");t.textContent="Julian",t.style.margin="0";const i=document.createElement("button");i.textContent="×",i.style.cssText=`
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
  `,i.onclick=k,e.appendChild(t),e.appendChild(i);const n=document.createElement("div");n.style.cssText=`
    flex: 1;
    padding: 15px;
    overflow-y: auto;
  `;const h=document.createElement("div");h.id="julian-response",h.style.cssText=`
    min-height: 200px;
    margin-bottom: 15px;
    padding: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    background-color: #f9f9f9;
    overflow-wrap: break-word;
  `;const p=document.createElement("div");p.style.cssText=`
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;const m=document.createElement("textarea");m.id="julian-input",m.placeholder="Ask Julian something...",m.style.cssText=`
    width: 100%;
    height: 100px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    resize: none;
  `;const s=document.createElement("div");s.style.cssText=`
    display: flex;
    gap: 10px;
  `;const l=document.createElement("button");l.textContent="Ask Julian",l.id="julian-submit",l.style.cssText=`
    padding: 8px 15px;
    background-color: #4a55af;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `,l.onclick=()=>{const r=document.getElementById("julian-input").value.trim();r&&(g(),console.log("Asking Julian..."),b().then(y=>{a.runtime.sendMessage({action:"askJulian",text:r,tabId:y})}))};const x=document.createElement("button");x.textContent="Summarize Page",x.style.cssText=`
    padding: 8px 15px;
    background-color: #4a55af;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `,x.onclick=()=>{g(),console.log("Summarizing page..."),b().then(r=>{a.runtime.sendMessage({action:"summarize",text:document.body.innerText,tabId:r})})};const c=document.createElement("button");c.textContent="Generate",c.id="julian-generate",c.style.cssText=`
    padding: 8px 15px;
    background-color: #4a55af;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `,c.onclick=()=>{const r=document.getElementById("julian-input").value.trim();r&&(console.log("Generating text..."),g(),b().then(y=>{a.runtime.sendMessage({action:"generate",text:r,tabId:y})}))},s.appendChild(l),s.appendChild(x),s.appendChild(c),p.appendChild(m),p.appendChild(s),n.appendChild(h),n.appendChild(p),o.appendChild(e),o.appendChild(n),document.body.appendChild(o);const u=document.createElement("button");u.id="julian-toggle",u.textContent="J",u.style.cssText=`
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #4a55af;
    color: white;
    font-size: 24px;
    font-weight: bold;
    border: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    z-index: 9998;
  `,u.onclick=C,document.body.appendChild(u)}function d(){o||E(),o.style.right="0",f=!0}function k(){o&&(o.style.right="-400px",f=!1)}function C(){f?k():d()}function g(){const e=document.getElementById("julian-response");e.innerHTML=`
    <div style="display: flex; justify-content: center; align-items: center; height: 100px;">
      <div style="border: 4px solid #f3f3f3; border-top: 4px solid #4a55af; border-radius: 50%; width: 30px; height: 30px; animation: julian-spin 1s linear infinite;"></div>
    </div>
    <style>
      @keyframes julian-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `}function v(e,t){const i=document.getElementById("julian-response");let n;switch(t){case"summarize":n="Page Summary";break;case"askJulian":n="Julian's Answer";break;case"generate":n="Generated Text";break;default:n="Response"}i.innerHTML=`
    <h3 style="margin-top: 0; color: #4a55af;">${n}</h3>
    <div>${j(e)}</div>
  `}function T(e){const t=document.getElementById("julian-response");t.innerHTML=`
    <h3 style="margin-top: 0; color: #e74c3c;">Error</h3>
    <div style="color: #e74c3c;">${e}</div>
  `}function j(e){if(typeof e=="object")try{e=JSON.stringify(e,null,2)}catch(t){e="Error formatting response: "+t.message}return e.replace(/\n/g,"<br>")}function b(){return new Promise(e=>{a.runtime.sendMessage({action:"getCurrentTabId"},t=>{e(t.tabId)})})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",w):w()})();
