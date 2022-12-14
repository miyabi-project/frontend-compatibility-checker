import CustomElement from "./custom-element";
import CustomDelegateClass, { CustomDelegate } from "./custom-delegate";

export default class Main implements CustomDelegate {
  // <可配置的選項>
  // 在檢測全部通過後，要跳轉到的網址（空: 不跳转; `a`: 显示一个弹出提示框。）
  urlOK = ""; // ""
  // 在檢測未完全透過時，要跳轉到的網址（空: 不跳转; `a`: 显示一个弹出提示框。）
  urlFail = ""; // ""
  // 無論是否成功都跳轉（覆蓋以上設定）
  url = ""; // ""
  // 在頁面中顯示詳細資訊（否則只有提示資訊和進度條）
  viewInfo = true; // true
  // 儲存記錄到: 0.禁用 1.會話儲存 2.持久儲存
  saveStorage = 1; // 0
  // 如果儲存記錄，鍵名是？（值將寫入 0 或 1 ）
  saveStorageKey = "compatibility"; // compatibility
  // 是否輸出一些關於資訊
  about = true;
  // 語言
  langID = 1;
  // </可配置的選項>

  planTotal = 14;
  progress: HTMLDivElement;
  progressStep = 0;
  checkbox: HTMLInputElement;
  checkboxspan: HTMLSpanElement;
  step = 0;
  ends: number[][] = [[], []];
  testArea: HTMLDivElement;
  ul: HTMLUListElement = document.createElement("ul");
  ls = {
    no: ["不支持当前浏览器，请更新到最新版本的浏览器再试。", "The current browser is not supported, please update to the latest version of the browser and try again."],
    chk: ["正在进行前端兼容性检查...", "Checking front-end compatibility..."],
    nr: ["如果下面的进度条卡住，可能是 网速原因 或者 ", "If the progress bar below is stuck, it may be due to network speed or "],
    code: ["源码", "source code"],
    compat: ["兼容性", "compatibility"],
    lang: ["语言", "language"],
    ua: ["用户代理", "user agent"],
    platform: ["平台", "platform"],
    vendor: ["供应商", "vendor"],
    cookie: ["是否启用 Cookie", "Cookie enabled"],
    onLine: ["是否在线", "Online"],
    ok: ["通过", "OK"],
    fail: ["未通过", "Fail"],
    end: ["检测结束", "End"],
    total: ["共", "Total"],
    pass: ["通过", "Pass"],
    chkok: ["检测通过!", "Check OK!"],
    cheaking: ["正在检测 ", "Cheaking "],
  };
  /**
   * 構造方法
   */
  constructor() {
    if (navigator.language.search("zh") >= 0) {
      this.langID = 0;
    }
    this.loadConf();
    const nojs: HTMLElement = document.getElementById("nojs") as HTMLElement;
    nojs.remove();
    const noscripts: HTMLCollectionOf<HTMLElement> = document.getElementsByTagName("noscript");
    for (const key in noscripts) {
      if (Object.prototype.hasOwnProperty.call(noscripts, key)) {
        const noscript = noscripts[key];
        noscript.remove();
      }
    }
    document.body.innerHTML = "<p><span id=\"stat\">" + this.ls.chk[this.langID] + "</span>" + (this.about ? "&emsp;&emsp;<a href=\"https://github.com/miyabi-project/frontend-compatibility-checker\" target=\"_blank\">" + this.ls.code[this.langID] + "</a>" : "") + "</p><span id=\"alert\">" + this.ls.nr[this.langID] + this.ls.no[this.langID] + "</span>";
    console.log(document.body.innerText);

    // UI
    this.progressStep = 100 / this.planTotal;
    const progressbar: HTMLDivElement = document.createElement("div");
    progressbar.id = "progressbar";
    this.progress = document.createElement("div");
    this.progress.id = "progress";
    progressbar.appendChild(this.progress);
    document.body.appendChild(progressbar);
    this.testArea = document.createElement("div");
    this.testArea.id = "testArea";
    const customElementn: HTMLElement = document.createElement("custom-element");
    customElementn.id = "custom-element";
    customElementn.className = "testObj";
    customElementn.setAttribute("c-val", "+");
    this.testArea.appendChild(customElementn);
    this.checkbox = document.createElement("input");
    this.checkbox.id = "checkbox";
    this.checkbox.className = "testObj";
    this.checkbox.type = "checkbox";
    this.testArea.appendChild(this.checkbox);
    this.checkboxspan = document.createElement("span");
    this.checkboxspan.id = "checkboxspan";
    this.checkboxspan.className = "testObj";
    this.testArea.appendChild(this.checkboxspan);
    document.body.appendChild(this.testArea);

    this.browserInfo();
    this.testNow();
  }

  /**
   * 獲取 # 後面的引數字典
   * @return {string[][]} 引數字典
   */
  urlArgv(): string[][] {
    const hashs: string = window.location.hash;
    if (hashs.length == 0) {
      return [];
    }
    let argv: string[] = hashs.split("#");
    if (argv.length < 1) {
      return [];
    }
    argv = argv[1].split("&");
    const keys: string[] = [];
    const vals: string[] = [];
    for (const arg of argv) {
      const args = arg.split("=");
      keys.push(args[0]);
      vals.push((args.length > 1) ? args[1] : "");
    }
    return [keys, vals];
  }

  /**
   * 匯入從網址輸入的配置
   */
  loadConf() {
    const argv: string[][] = this.urlArgv();
    if (argv.length == 0) {
      return;
    }
    const keys: string[] = argv[0];
    const vals: string[] = argv[1];
    for (let i = 0; i < keys.length; i++) {
      const v: string = vals[i];
      switch (keys[i]) {
        case "urlOK":
          this.urlOK = v;
          break;
        case "urlFail":
          this.urlFail = v;
          break;
        case "viewInfo":
          this.viewInfo = (v != "0");
          break;
        case "saveStorage":
          this.saveStorage = parseInt(v);
          break;
        case "saveStorageKey":
          this.saveStorageKey = v;
          break;
        case "about":
          this.about = (v == "true");
          break;
        case "langID":
          this.langID = parseInt(v);
          break;
      }
    }
  }

  /**
   * 立即開始下一步測試任務
   */
  testNow() {
    this.progress.style.width = (this.step * this.progressStep).toString() + "%";
    console.log(this.progress.style.width);
    this.step++;
    const chk: string = this.ls.cheaking[this.langID];
    const c = " " + this.ls.compat[this.langID] + "...";
    switch (this.step) {
      case 1:
        this.addLine("<hr/>");
        this.addTitle(chk + "HTML5" + c);
        this.html5Test();
        this.testDelay();
        break;
      case 2:
        this.addTitle(chk + "Canvas" + c);
        this.canvasTest();
        this.testDelay();
        break;
      case 3:
        this.addTitle(chk + "SVG" + c);
        this.svgTest();
        this.testDelay();
        break;
      case 4:
        this.addLine("<hr/>");
        this.addTitle(chk + "CSS" + c);
        this.cssSelecterTest();
        this.testDelay();
        break;
      case 5:
        this.addTitle(chk + "CSS Keyframes" + c);
        this.cssKeyframes();
        break;
      case 6:
        this.addTitle(chk + "CSS Transition" + c);
        this.cssTransition();
        break;
      case 7:
        this.addLine("<hr/>");
        this.addTitle(chk + "ES6" + c);
        this.es6Test();
        this.testDelay();
        break;
      case 8:
        this.addTitle(chk + "Event" + c);
        this.clickTest();
        break;
      case 9:
        this.addTitle(chk + "Delegate" + c);
        this.delegateTest();
        break;
      case 10:
        this.addLine("<hr/>");
        this.addTitle(chk + "JSON" + c);
        this.jsonTest();
        this.testDelay();
        break;
      case 11:
        this.addTitle(chk + "Map/Set" + c);
        this.mapSetTest();
        this.testDelay();
        break;
      case 12:
        this.addTitle(chk + "Custom element" + c);
        this.customElementTest();
        break;
      case 13:
        this.addLine("<hr/>");
        this.addTitle(chk + "Storage" + c);
        this.storageTest();
        this.testDelay();
        break;
      case 14:
        this.addTitle(chk + "WebGL" + c);
        this.webGLTest();
        this.testDelay();
        break;
      default:
        this.end();
        break;
    }
  }

  /**
   * 延遲啟動下一步測試任務
   * @param {number} time 延遲時間
   */
  testDelay(time = 100) {
    setTimeout(() => {
      this.testNow();
    }, time);
  }

  /**
   * 瀏覽器資訊
   */
  browserInfo() {
    const texts: string[][] = [
      [this.ls.lang[this.langID], navigator.language],
      [this.ls.ua[this.langID], navigator.userAgent],
      [this.ls.platform[this.langID], navigator.platform],
      [this.ls.vendor[this.langID], navigator.vendor],
      [this.ls.cookie[this.langID], navigator.cookieEnabled.toString()],
      [this.ls.onLine[this.langID], navigator.onLine.toString()],
    ];
    if (this.viewInfo) {
      const ul: HTMLUListElement = document.createElement("ul");
      for (const text of texts) {
        console.log(text[0] + ": " + text[1]);
        const li: HTMLLIElement = document.createElement("li");
        li.innerHTML = text[0] + ":&emsp;";
        const code: HTMLElement = document.createElement("code");
        code.innerText = text[1];
        li.appendChild(code);
        ul.appendChild(li);
      }
      document.body.appendChild(document.createElement("hr"));
      document.body.appendChild(ul);
    }
  }

  /**
   * 檢查 HTML5 相容性
   * @return {boolean} 檢查結果
   */
  html5Test(): boolean {
    if (typeof (Worker) !== "undefined") {
      return this.ok(typeof (Worker));
    } else {
      return this.fail(typeof (Worker));
    }
  }

  /**
   * 檢查 Canvas 相容性
   * @return {boolean} 檢查結果
   */
  canvasTest(): boolean {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (typeof canvas.getContext == "function" && ctx) {
      return this.ok(typeof ctx);
    } else {
      return this.fail(typeof ctx);
    }
  }

  /**
   * 檢查 SVG 相容性
   * @return {boolean} 檢查結果
   */
  svgTest(): boolean {
    if (!document.createElementNS) {
      return this.fail();
    }
    const svg: SVGSVGElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    if (svg) {
      return this.ok(typeof svg);
    } else {
      return this.fail(typeof svg);
    }
  }

  /**
   * 檢查 CSS 選擇器
   */
  cssSelecterTest() {
    // 10 -> 20 -> 10
    this.checkboxspan.style.animation = "";
    this.checkboxspan.style.transition = "";
    this.checkbox.checked = true;
    let isOK = false;
    let okStr = "";
    let width: number = this.checkboxspan.offsetWidth;
    isOK = (width == 20);
    okStr = `${isOK}${width}`;
    this.checkbox.click();
    width = this.checkboxspan.offsetWidth;
    isOK = (width == 10);
    okStr += ` ${isOK}${width}`;
    if (isOK) {
      this.ok(okStr);
    } else {
      this.fail(okStr);
    }
  }

  /**
   * 檢查 CSS Keyframes 動畫
   */
  cssKeyframes() {
    // 10 -> 40
    this.checkboxspan.style.animation = "spanani 0.3s linear forwards";
    setTimeout(() => {
      if (this.checkboxspan.offsetWidth == 40) {
        this.ok(this.checkboxspan.offsetWidth.toString());
      } else {
        this.fail(this.checkboxspan.offsetWidth.toString());
      }
      this.checkboxspan.style.animation = "";
      this.testNow();
    }, 500);
  }

  /**
   * 檢查 CSS Transition 動畫
   */
  cssTransition() {
    // 40 -> 50
    this.checkboxspan.style.animation = "";
    this.checkboxspan.style.transition = "0.3s";
    this.checkboxspan.style.width = "50px";
    setTimeout(() => {
      const width: number = this.checkboxspan.offsetWidth;
      if (width == 50) {
        this.ok(width.toString());
      } else {
        this.fail(width.toString());
      }
      this.checkboxspan.style.transition = "";
      this.testNow();
    }, 500);
  }

  /**
   * 檢查 ES6 相容性
   * @return {boolean} 檢查結果
   */
  es6Test(): boolean {
    const arrowFunction = "var t = () => {};";
    const asyncFunction = "var t = async () => {};";
    try {
      const f1 = new Function(arrowFunction);
      const f2 = new Function(asyncFunction);
      return this.ok(f1.toString() + " " + f2.toString());
    }
    catch (e: any) {
      this.fail(e.toString());
      return false;
    }
  }

  /**
   * 檢查 Event 事件
   */
  clickTest() {
    this.checkbox.addEventListener("click", () => {
      this.checkboxspan.style.width = "10px";
    });
    setTimeout(() => {
      if (this.checkboxspan.style.width == "10px") {
        this.ok(this.checkboxspan.style.width);
      } else {
        this.fail(this.checkboxspan.style.width);
      }
      this.testNow();
    }, 100);
    this.checkbox.click();
  }

  /**
   * CustomDelegate 代理方法的實現
   * @param {string} val1 返回值1
   * @param {number} val2 返回值2
   */
  delegateFunc(val1: string, val2: number) {
    if (val1 == "1" && val2 == 0) {
      this.ok(val1 + val2);
    } else {
      this.fail(val1 + val2);
    }
    this.testNow();
  }

  /**
   * 檢查 代理方法
   */
  delegateTest() {
    const testClass = new CustomDelegateClass();
    testClass.delegate = this;
  }

  /**
   * 檢查 JSON 序列化和解析
   * @return {boolean} 檢查結果
   */
  jsonTest(): boolean {
    const data: any = {};
    for (let i = 0; i < 10; i++) {
      const rand: number = Math.random();
      data[i.toString()] = (rand >= 0.5) ? rand : rand.toString();

    }
    try {
      const json: string = JSON.stringify(data);
      const obj: any = JSON.parse(json);
      const json2: string = JSON.stringify(obj);
      if (json == json2) {
        return this.ok(json);
      } else {
        return this.fail(json);
      }
    } catch (e: any) {
      return this.fail(e.toString());
    }
  }

  /**
   * 檢查 對映和集合支援
   * @return {boolean} 檢查結果
   */
  mapSetTest(): boolean {
    const map: Map<string, string | number> = new Map<string, string | number>();
    const set: Set<string | number> = new Set<string | number>();
    for (let i = 0; i < 10; i++) {
      const rand: number = Math.random();
      const key: string = rand.toString();
      const val: string | number = (rand >= 0.5) ? rand : rand.toString();
      map.set(key, val);
      set.add(val);
    }
    let json = "";
    try {
      const obj = Object.create(null);
      for (const [k, v] of map) {
        obj[k] = v;
      }
      json = "|" + JSON.stringify(obj);
      const arr = [...set];
      json += "|" + JSON.stringify(arr);
    } catch (e) {
      console.log(e);
    }
    if (map.size == 10 && set.size == 10) {
      return this.ok(map.size.toString() + json);
    } else {
      return this.fail(map.size.toString() + json);
    }
  }

  /**
   * 檢查 自定義元素
   */
  customElementTest() {
    if (!window.customElements.define) {
      return this.fail();
    }
    window.customElements.define("custom-element", CustomElement);
    const customElement: CustomElement = document.getElementById("custom-element") as CustomElement;
    customElement.addInfo();
    setTimeout(() => {
      const customElementE: CustomElement = document.getElementById("custom-element") as CustomElement;
      if (customElementE.innerHTML == "-+") {
        this.ok(customElementE.innerHTML);
      } else {
        this.fail(customElementE.innerHTML);
      }
      this.testNow();
    }, 100);
  }

  /**
   * 檢查 Storage 儲存
   * @returns {boolean} 檢查結果
   */
  storageTest(): boolean {
    const timestamp: number = new Date().getTime();
    let val: string = timestamp.toString();
    let key: string = "frontend-compatibility-checker-" + val;
    if (window.Storage && window.localStorage && window.localStorage instanceof Storage) {
      const vals = ["", ""];
      sessionStorage.setItem(key, val);
      vals[0] = sessionStorage.getItem(key) ?? "";
      if (vals[0] != val) {
        return this.fail(val);
      }
      sessionStorage.removeItem(key);
      key += "T";
      val += "T";
      localStorage.setItem(key, val);
      vals[1] = localStorage.getItem(key) ?? "";
      if (vals[1] != val) {
        return this.fail(val);
      }
      localStorage.removeItem(key);
      return this.ok(vals.join(","));
    } else {
      return this.fail(val);
    }
  }

  /**
   * 檢查 WebGL 支援
   * @returns {boolean} 檢查結果
   */
  webGLTest(): boolean {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const gl: WebGLRenderingContext | RenderingContext | null = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl && (gl instanceof WebGLRenderingContext)) {
      return this.ok(typeof gl);
    } else {
      return this.fail(typeof gl);
    }
  }

  /**
   * 輸出成功的結果
   * @param text 細節資訊
   * @return {boolean} true
   */
  ok(text = ""): boolean {
    this.ends[0].push(this.step);
    return this.addInfo(text, true);
  }

  /**
   * 輸出失敗的結果
   * @param text 細節資訊
   * @return {boolean} false
   */
  fail(text = ""): boolean {
    this.ends[1].push(this.step);
    return this.addInfo(text, false);
  }

  /**
   * 輸出成功或失敗的結果
   * @param info 細節資訊
   * @param isOK 是否成功
   * @return {boolean} 是否成功
   */
  addInfo(info: string, isOK: boolean): boolean {
    if (isOK) {
      console.log(isOK, info);
    } else {
      console.warn(isOK, info);
      this.progress.style.backgroundColor = "#F00";
    }
    if (!this.viewInfo) return isOK;
    const ul = document.createElement("ul");
    const li: HTMLLIElement = document.createElement("li");
    const span: HTMLSpanElement = document.createElement("span");
    span.className = isOK ? "ok" : "ng";
    span.title = info;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = isOK;
    checkbox.onclick = function () {
      return false;
    };
    checkbox.readOnly = true;
    span.innerText = ` ${isOK ? this.ls.ok[this.langID] : this.ls.fail[this.langID]}! `;
    span.insertBefore(checkbox, span.firstChild);
    li.appendChild(span);
    ul.appendChild(li);
    this.ul.appendChild(ul);
    return isOK;
  }

  /**
   * 顯示當前檢測任務的標題
   * @param title 當前檢測任務的標題
   */
  addTitle(title: string) {
    console.log(title);
    if (!this.viewInfo) return;
    const line: HTMLDivElement = document.createElement("div");
    this.ul = document.createElement("ul");
    const li: HTMLLIElement = document.createElement("li");
    li.innerText = title;
    this.ul.appendChild(li);
    line.appendChild(this.ul);
    document.body.appendChild(line);
  }

  /**
   * 新增一行輸出資訊
   * @param text 輸出資訊
   */
  addLine(text: string) {
    if (!this.viewInfo) return;
    const line: HTMLDivElement = document.createElement("div");
    line.innerHTML = text;
    document.body.appendChild(line);
  }

  /**
   * 所有測試任務結束後進行的操作
   */
  end() {
    this.progress.style.transition = "none";
    this.progress.style.width = "100%";
    const testObjs: HTMLCollectionOf<Element> = document.getElementsByClassName("testObj");
    for (const key in testObjs) {
      if (Object.prototype.hasOwnProperty.call(testObjs, key)) {
        const testObj: HTMLElement = testObjs[key] as HTMLElement;
        testObj.style.display = "none";
      }
    }
    const stat: HTMLSpanElement = document.getElementById("stat") as HTMLSpanElement;
    const alerti: HTMLSpanElement = document.getElementById("alert") as HTMLSpanElement;
    console.log(stat.innerText);
    const endi: number[] = [
      this.ends[0].length,
      this.ends[1].length
    ];
    stat.innerText = this.about ? `${this.ls.end[this.langID]}, ${this.ls.total[this.langID]} ${endi[0] + endi[1]} , ${this.ls.pass[this.langID]} ${endi[0]} , ${this.ls.fail[this.langID]} ${endi[1]} .` : "";
    this.testArea.remove();
    const isOK: boolean = endi[1] == 0;
    if (this.saveStorage > 0 && this.saveStorageKey.length > 0 && window.Storage && window.localStorage && window.localStorage instanceof Storage) {
      const save: Storage = (this.saveStorage == 1) ? window.sessionStorage : window.localStorage;
      const saveVal: string = [
        "1", // 版本
        endi[1] == 0 ? "A" : this.ends[0].join("/"), // 成功的ID列表
        endi[0] == 0 ? "A" : this.ends[1].join("/"), // 失敗的ID列表
        new Date().valueOf()
      ].join(",");
      save.setItem(this.saveStorageKey, saveVal);
    }
    if (isOK) {
      alerti.innerText = this.ls.chkok[this.langID];
      console.log(alerti.innerText);
      if (this.urlOK.length > 0 || this.url.length > 0) {
        if (this.url.length == 0 && this.urlOK == "a") {
          alert(alerti.innerText);
        } else {
          console.log("->", this.urlOK);
          this.jmp(this.urlOK);
        }
      }
    } else {
      alerti.innerText = this.ls.no[this.langID];
      console.warn(this.ls.no[this.langID]);
      if (this.urlFail.length > 0 || this.url.length > 0) {
        if (this.url.length == 0 && this.urlFail == "a") {
          alert(this.ls.no[this.langID]);
        } else {
          console.log("->", this.urlFail);
          this.jmp(this.urlFail);
        }
      }
    }
    alerti.style.fontWeight = "bold";
  }

  /**
   * 網頁跳轉
   * @param url 要跳轉到的網址
   */
  jmp(url: string) {
    this.progress.style.width = "0%";
    setTimeout(() => {
      this.progress.style.transition = "width 30s ease-out";
      this.progress.style.width = "100%";
      window.location.replace(url);
    }, 100);
  }
}
