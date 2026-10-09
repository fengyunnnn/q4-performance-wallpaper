(() => {
  const goals = [
    { group: "需求承接", weight: "15%", items: [["影视智能体迭代", "10.09–12.31", "分析 → 设计 → 评审 → 排期 → 上线"], ["软终端迭代", "10.09–12.31", "分析 → 设计 → 评审 → 排期 → 上线"], ["AI电视助手 Lite", "10.21 前", "形成差异化迭代方向文档，并跟进反馈修改"]] },
    { group: "竞品分析", weight: "10%", items: [["中屏新体验对比", "10.09–10.21", "更新中屏竞品分析材料"], ["竞品专项分析", "10.22 启动", "选定终端品类，形成专题报告 + 部门分享"]] },
    { group: "行业动态追踪", weight: "10%", items: [["行业动态文档", "10.09–12.31", "每周至少更新 1 版"], ["系统性调研", "10.09–12.31", "10.22 前选定方向；双周输出简报"], ["深度专题研究", "10.22–12.11", "形成专题研究报告"]] },
    { group: "用户研究", weight: "5%", items: [["灵犀屏用户使用行为研究", "11.01–12.31", "形成用户研究报告"]] },
    { group: "部门分享与讨论", weight: "5%", items: [["新方向讨论", "10.09–12.31", "至少 2 次，输出观点 / 会议纪要"], ["部门分享", "10.09–12.31", "至少 2 次，形成分享材料 / 记录"]] }
  ];
  const phaseGoals = [
    { group: "需求承接", weight: "15%", items: [["需求全流程跟踪（2个）", "截至 10.21", "需求来源 → 评审 → 排期 → 验收，沉淀完整跟踪记录"], ["主责需求 / 模块交付（1个）", "截至 10.21", "形成可支持评审、研发或测试的产品材料"], ["AI电视助手 Lite 差异化方向", "截至 10.21", "形成运营商场景方向文档，并根据反馈迭代完善"]] },
    { group: "竞品分析", weight: "10%", items: [["主流竞品体验报告（2–3个）", "截至 09.21", "完成基础体验与横向对比，形成竞品体验报告"], ["细分能力专项分析", "截至 10.21", "围绕情绪化合成、记忆能力等一个方向形成初步结论"]] },
    { group: "行业动态追踪", weight: "10%", items: [["行业动态阶段同步（≥2次）", "08.22–10.21", "持续更新行业动态追踪，完成至少 2 次阶段同步"], ["AI 交互方向调研（1–2个）", "截至 10.21", "选定关注方向，并按双周整理摘要或简报要点"]] },
    { group: "产品开发", weight: "10%", items: [["IPD / Charter / IPMS 学习笔记", "截至 10.21", "理解基本概念、核心目标与主要环节，形成问题清单或学习笔记"]] }
  ];
  const milestones = [["2026-10-21", "Lite 差异化迭代方向文档"], ["2026-10-21", "中屏新体验对比材料更新"], ["2026-10-22", "系统性调研方向确定"], ["2026-10-22", "竞品专项分析启动"], ["2026-12-11", "深度专题研究报告完成"], ["2026-12-31", "Q4 任务闭环与材料沉淀"]];
  const keys = { task: "q4-performance-task-status-v1", log: "q4-performance-daily-logs-v1", weekly: "q4-performance-weekly-reviews-v1", custom: "q4-performance-custom-milestones-v1" };
  const fields = ["topic", "plan", "done", "blocker", "learning", "source", "feedback", "action", "ticktick"];
  const inputs = Object.fromEntries(fields.map(field => [field + "Input", field]));
  const maxBackupBytes = 5 * 1024 * 1024;
  const q = selector => document.querySelector(selector);
  const taskId = (group, name) => group + "-" + name;
  const phaseLegacyTitles = { "需求全流程跟踪（2个）": "跟踪 2 个真实需求闭环", "主责需求 / 模块交付（1个）": "主责 1 个需求或明确模块", "AI电视助手 Lite 差异化方向": "新媒体落地分析与 Lite 方向", "主流竞品体验报告（2–3个）": "主要竞品基础体验对比", "细分能力专项分析": "细分方向初步分析", "行业动态阶段同步（≥2次）": "行业动态阶段同步", "AI 交互方向调研（1–2个）": "初步方向关注与双周摘要", "IPD / Charter / IPMS 学习笔记": "IPD / Charter / IPMS 初步学习" };
  const phaseTaskId = (group, name) => "phase2-" + group + "-" + (phaseLegacyTitles[name] || name);
  const taskIds = new Set(goals.flatMap(group => group.items.map(item => taskId(group.group, item[0]))));
  const phaseTaskIds = new Set(phaseGoals.flatMap(group => group.items.map(item => phaseTaskId(group.group, item[0]))));
  const allTaskIds = new Set([...taskIds, ...phaseTaskIds]);
  const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const isDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value);
  const now = () => new Date().toISOString();
  const read = (key, fallback = {}) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const localDate = (date = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(date);
  const esc = value => { const node = document.createElement("div"); node.textContent = value; return node.innerHTML; };
  let pendingImport = null;
  let activeGoal = 0;
  let activePhaseGoal = 0;
  let activeTask = null;

  function taskRecord(value, fallback = now()) {
    if (typeof value === "boolean") return { completed: value, updatedAt: fallback, version: 1 };
    if (!isObject(value) || typeof value.completed !== "boolean") return null;
    return { completed: value.completed, updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : fallback, version: Number.isInteger(value.version) && value.version > 0 ? value.version : 1 };
  }
  function tasks(value) {
    if (!isObject(value)) return {};
    return Object.fromEntries(Object.entries(value).map(([id, record]) => [id, taskRecord(record)]).filter(([, record]) => record));
  }
  function dailyTasks(value, fallback = now()) {
    if (!Array.isArray(value)) return [];
    return value.filter(item => isObject(item) && typeof item.title === "string").map(item => ({ id: typeof item.id === "string" ? item.id : "daily-" + Date.now() + "-" + Math.random().toString(16).slice(2), title: item.title.slice(0, 80), source: typeof item.source === "string" ? item.source.slice(0, 80) : "自定义", linkedTaskId: typeof item.linkedTaskId === "string" && allTaskIds.has(item.linkedTaskId) ? item.linkedTaskId : "", completed: item.completed === true, createdAt: typeof item.createdAt === "string" ? item.createdAt : fallback, updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : fallback }));
  }
  function logRecord(value, fallback = now()) {
    if (!isObject(value)) return null;
    const result = Object.fromEntries(fields.map(field => [field, typeof value[field] === "string" ? value[field] : ""]));
    result.updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : fallback;
    result.version = Number.isInteger(value.version) && value.version > 0 ? value.version : 1;
    result.dailyTasks = dailyTasks(value.dailyTasks, fallback);
    return result;
  }
  function logs(value) {
    if (!isObject(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([date]) => isDate(date)).map(([date, record]) => [date, logRecord(record)]).filter(([, record]) => record));
  }
  function weeks(value) {
    if (!isObject(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([date, record]) => isDate(date) && isObject(record)));
  }
  function customMilestones(value) {
    if (!isObject(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([id, items]) => allTaskIds.has(id) && Array.isArray(items)).map(([id, items]) => [id, items.filter(item => isObject(item) && typeof item.title === "string").map(item => ({ id: typeof item.id === "string" ? item.id : "milestone-" + Date.now() + "-" + Math.random().toString(16).slice(2), title: item.title.slice(0, 80), date: typeof item.date === "string" && isDate(item.date) ? item.date : "", completed: item.completed === true, updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : now() }))]));
  }
  function findTask(id) {
    for (const group of goals) { const item = group.items.find(candidate => taskId(group.group, candidate[0]) === id); if (item) return { group, item, board: "Q4 绩效任务" }; }
    for (const group of phaseGoals) { const item = group.items.find(candidate => phaseTaskId(group.group, candidate[0]) === id); if (item) return { group, item, board: "试用期第二阶段计划" }; }
    return null;
  }
  function taskDescription(group, item) {
    const details = {
      "影视智能体迭代": "独立承接后续迭代，先澄清用户、客户与业务问题，再形成可评审、可研发、可测试的方案，并跟进上线后的问题闭环。",
      "软终端迭代": "围绕后续迭代需求完成端到端承接，明确范围、依赖与验收标准，持续推动评审、排期、研发测试及上线跟进。",
      "AI电视助手 Lite": "从运营商家庭场景出发，收敛差异化机会，形成可用于讨论或决策的方向文档，并根据关键反馈迭代完善。",
      "中屏新体验对比": "在既有体验报告基础上，围绕真实使用场景、交互链路和体验差异更新分析材料，为中屏新体验判断提供依据。",
      "竞品专项分析": "选定一个终端品类，对主要竞品的能力、体验与生态逻辑进行横向对比，输出可落地的部门讨论输入。",
      "行业动态文档": "持续筛选和核验语音交互、AI 人机交互与智能终端动态，沉淀事实、判断及与家庭场景相关的启示。",
      "系统性调研": "选择 1—2 个值得深入的方向，以双周简报持续沉淀行业事实、趋势判断、业务机会和待验证问题。",
      "深度专题研究": "围绕一个 AI 人机交互方向，完成从事实梳理、分析框架到明确结论和业务建议的专题研究。",
      "灵犀屏用户使用行为研究": "收集并分析用户行为信息，区分事实、推断与建议，输出关键发现及可验证的产品优化方向。",
      "新方向讨论": "参与泛智能终端等新方向的讨论，形成有依据的个人观点、待确认问题或会议纪要。",
      "部门分享": "将阶段研究或业务认知整理为可留存的分享材料，收集讨论反馈并转化为后续动作。"
    };
    return details[item[0]] || item[2];
  }
  function taskDeliverables(group, item) {
    if (group.group === "需求承接") return ["需求分析与方案材料", "评审结论 / 待办", "排期、测试或上线跟进记录"];
    if (group.group === "竞品分析") return ["体验或能力对比记录", "结论与业务建议", "专题报告或分享材料"];
    if (group.group === "行业动态追踪") return ["核验后的行业事实", "趋势判断与业务启示", "周更、简报或专题报告"];
    if (group.group === "用户研究") return ["用户行为数据与分析过程", "关键发现", "产品优化建议"];
    return ["讨论观点或会议纪要", "分享材料 / 记录", "反馈后的下一步动作"];
  }
  function weekRange(dateString) {
    const date = new Date(dateString + "T12:00:00");
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() || 7) - 1));
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    return [localDate(monday), localDate(sunday)];
  }
  function render() {
    const status = tasks(read(keys.task));
    const all = [...taskIds], done = all.filter(id => status[id]?.completed).length;
    q("#taskProgress").textContent = done + " / " + all.length;
    q("#weekFocus").textContent = (all.length - done) + " 项待推进";
    if (activeGoal >= goals.length) activeGoal = 0;
    q("#goalPager").innerHTML = goals.map((group, index) => "<button type=\"button\" class=\"" + (index === activeGoal ? "active" : "") + "\" data-goal-page=\"" + index + "\">" + group.group + " <small>" + group.weight + "</small></button>").join("");
    const group = goals[activeGoal];
    q("#goalGroups").innerHTML = "<article class=\"goal-group\"><div class=\"group-head\"><strong>" + group.group + "</strong><span>权重 " + group.weight + "</span></div>" + group.items.map(item => {
      const id = taskId(group.group, item[0]), completed = status[id]?.completed;
      return "<article class=\"task-card " + (completed ? "done" : "") + "\"><button type=\"button\" class=\"task-open\" data-open-task=\"" + id + "\"><b>" + item[0] + "</b><small>" + item[1] + " · " + item[2] + "</small></button><button type=\"button\" class=\"task-toggle\" data-toggle-task=\"" + id + "\"><i>" + (completed ? "✓" : "") + "</i>" + (completed ? "已完成" : "完成") + "</button></article>";
    }).join("") + "</article>";
    document.querySelectorAll("[data-goal-page]").forEach(button => button.addEventListener("click", () => { activeGoal = Number(button.dataset.goalPage); render(); }));
    document.querySelectorAll("[data-open-task]").forEach(button => button.addEventListener("click", () => openTask(button.dataset.openTask)));
    document.querySelectorAll("[data-toggle-task]").forEach(button => button.addEventListener("click", () => {
      const updated = tasks(read(keys.task)), previous = updated[button.dataset.toggleTask];
      updated[button.dataset.toggleTask] = { completed: !previous?.completed, updatedAt: now(), version: (previous?.version || 0) + 1 };
      write(keys.task, updated); render();
    }));
    const today = localDate(), next = milestones.find(item => item[0] >= today) || milestones[milestones.length - 1];
    q("#nextMilestone").textContent = next[0].slice(5).replace("-", ".") + " " + next[1].slice(0, 7);
    q("#milestoneHint").textContent = "下一个：" + next[1];
    q("#milestoneList").innerHTML = milestones.map(item => "<div class=\"milestone " + (item[0] < today ? "past" : "") + "\"><time>" + item[0].slice(5).replace("-", ".") + "</time><span>" + item[1] + "</span></div>").join("");
    renderPhase();
    renderLogs();
  }
  function renderPhase() {
    const status = tasks(read(keys.task));
    if (activePhaseGoal >= phaseGoals.length) activePhaseGoal = 0;
    q("#phasePager").innerHTML = phaseGoals.map((group, index) => "<button type=\"button\" class=\"" + (index === activePhaseGoal ? "active" : "") + "\" data-phase-page=\"" + index + "\">" + group.group + " <small>" + group.weight + "</small></button>").join("");
    const group = phaseGoals[activePhaseGoal];
    const ids = group.items.map(item => phaseTaskId(group.group, item[0]));
    const done = ids.filter(id => status[id]?.completed).length;
    q("#phaseProgress").textContent = done + " / " + ids.length;
    q("#phaseGroups").innerHTML = "<article class=\"goal-group phase-goal-group\"><div class=\"group-head\"><strong>" + group.group + "</strong><span>权重 " + group.weight + "</span></div>" + group.items.map(item => {
      const id = phaseTaskId(group.group, item[0]), completed = status[id]?.completed;
      return "<article class=\"task-card " + (completed ? "done" : "") + "\"><button type=\"button\" class=\"task-open\" data-open-task=\"" + id + "\"><b>" + item[0] + "</b><small>" + item[1] + " · " + item[2] + "</small></button><button type=\"button\" class=\"task-toggle\" data-toggle-task=\"" + id + "\"><i>" + (completed ? "✓" : "") + "</i>" + (completed ? "已完成" : "完成") + "</button></article>";
    }).join("") + "</article>";
    document.querySelectorAll("[data-phase-page]").forEach(button => button.addEventListener("click", () => { activePhaseGoal = Number(button.dataset.phasePage); renderPhase(); }));
    document.querySelectorAll("#phaseGroups [data-open-task]").forEach(button => button.addEventListener("click", () => openTask(button.dataset.openTask)));
    document.querySelectorAll("#phaseGroups [data-toggle-task]").forEach(button => button.addEventListener("click", () => {
      const updated = tasks(read(keys.task)), previous = updated[button.dataset.toggleTask];
      updated[button.dataset.toggleTask] = { completed: !previous?.completed, updatedAt: now(), version: (previous?.version || 0) + 1 };
      write(keys.task, updated); renderPhase();
    }));
  }
  function openTask(id) {
    activeTask = id;
    q("#taskDialog").hidden = false;
    renderTaskDetail();
  }
  function renderTaskDetail() {
    const found = activeTask && findTask(activeTask);
    if (!found) return;
    const { group, item, board } = found;
    q("#taskDetailGroup").textContent = board + " · " + group.group + " · 子需求详情";
    q("#taskDetailTitle").textContent = item[0];
    q("#taskDetailMeta").innerHTML = "<span>时间：" + item[1] + "</span><span>维度权重：" + group.weight + "</span><span>所属：" + board + "</span>";
    q("#taskDetailDescription").textContent = taskDescription(group, item);
    q("#taskDetailDeliverables").innerHTML = taskDeliverables(group, item).map(value => "<li>" + value + "</li>").join("");
    const collection = customMilestones(read(keys.custom));
    const items = collection[activeTask] || [];
    q("#customMilestoneList").innerHTML = items.length ? items.map(milestone => "<article class=\"custom-milestone-item " + (milestone.completed ? "done" : "") + "\"><input type=\"checkbox\" data-custom-toggle=\"" + milestone.id + "\" " + (milestone.completed ? "checked" : "") + " aria-label=\"标记完成\" /><span>" + esc(milestone.title) + "</span><time>" + (milestone.date || "未设日期") + "</time><button type=\"button\" data-custom-delete=\"" + milestone.id + "\">移除</button></article>").join("") : "<p class=\"empty\">还没有自定义里程碑。可以从下一次评审、阶段交付或复盘节点开始。</p>";
    document.querySelectorAll("[data-custom-toggle]").forEach(input => input.addEventListener("change", () => {
      const updated = customMilestones(read(keys.custom));
      updated[activeTask] = (updated[activeTask] || []).map(milestone => milestone.id === input.dataset.customToggle ? { ...milestone, completed: input.checked, updatedAt: now() } : milestone);
      write(keys.custom, updated); renderTaskDetail();
    }));
    document.querySelectorAll("[data-custom-delete]").forEach(button => button.addEventListener("click", () => {
      const updated = customMilestones(read(keys.custom));
      updated[activeTask] = (updated[activeTask] || []).filter(milestone => milestone.id !== button.dataset.customDelete);
      write(keys.custom, updated); renderTaskDetail();
    }));
  }
  function addCustomMilestone() {
    if (!activeTask) return;
    const title = q("#customMilestoneTitle").value.trim();
    const date = q("#customMilestoneDate").value;
    if (!title) { q("#customMilestoneTitle").focus(); return; }
    const collection = customMilestones(read(keys.custom));
    collection[activeTask] = [...(collection[activeTask] || []), { id: "milestone-" + Date.now() + "-" + Math.random().toString(16).slice(2), title: title.slice(0, 80), date: isDate(date) ? date : "", completed: false, updatedAt: now() }];
    write(keys.custom, collection);
    q("#customMilestoneTitle").value = "";
    q("#customMilestoneDate").value = "";
    renderTaskDetail();
  }
  function renderLogs() {
    const collection = logs(read(keys.log)), entry = collection[q("#logDate").value || localDate()];
    q("#todayPreview").textContent = entry?.done || "今天还没有记录。用 3 分钟写下推进事项和阻塞点。";
    Object.entries(inputs).forEach(([input, field]) => { q("#" + input).value = entry?.[field] || ""; });
    renderDailyTasks(entry);
    const history = Object.entries(collection).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);
    q("#logHistory").innerHTML = history.length ? history.map(([date, log]) => "<article><time>" + date + "</time><p>" + esc(log.done || "未填写完成事项") + "</p>" + (log.topic ? "<small>主题：" + esc(log.topic) + "</small>" : "") + (log.learning ? "<small>学习：" + esc(log.learning) + "</small>" : "") + (log.blocker ? "<small>阻塞：" + esc(log.blocker) + "</small>" : "") + "</article>").join("") : "<p class=\"empty\">尚无记录</p>";
  }
  function renderDailyTasks(entry) {
    const options = [{ label: "选择计划任务加入今日", value: "" }, ...goals.flatMap(group => group.items.map(item => ({ label: "Q4 · " + group.group + "｜" + item[0], value: taskId(group.group, item[0]) }))), ...phaseGoals.flatMap(group => group.items.map(item => ({ label: "第二阶段 · " + group.group + "｜" + item[0], value: phaseTaskId(group.group, item[0]) })) )];
    q("#dailyTaskPicker").innerHTML = options.map(option => "<option value=\"" + option.value + "\">" + option.label + "</option>").join("");
    const items = entry?.dailyTasks || [];
    q("#dailyTaskProgress").textContent = items.filter(item => item.completed).length + " / " + items.length + " 已完成";
    q("#dailyTaskList").innerHTML = items.length ? items.map(item => "<article class=\"daily-task-item " + (item.completed ? "done" : "") + "\"><input type=\"checkbox\" data-daily-toggle=\"" + item.id + "\" " + (item.completed ? "checked" : "") + " aria-label=\"标记当天任务完成\" /><span>" + esc(item.title) + "<small>" + esc(item.source) + "</small></span><button type=\"button\" data-daily-delete=\"" + item.id + "\">移除</button></article>").join("") : "<p class=\"empty\">今天还未配置待办。</p>";
    document.querySelectorAll("[data-daily-toggle]").forEach(input => input.addEventListener("change", () => updateDailyTasks(items => items.map(item => item.id === input.dataset.dailyToggle ? { ...item, completed: input.checked, updatedAt: now() } : item))));
    document.querySelectorAll("[data-daily-delete]").forEach(button => button.addEventListener("click", () => updateDailyTasks(items => items.filter(item => item.id !== button.dataset.dailyDelete))));
  }
  function updateDailyTasks(change) {
    const collection = logs(read(keys.log));
    const date = q("#logDate").value || localDate();
    const current = collection[date] || logRecord({}, now());
    Object.entries(inputs).forEach(([input, field]) => { current[field] = q("#" + input).value.trim(); });
    current.dailyTasks = change(current.dailyTasks || []);
    current.updatedAt = now(); current.version = (current.version || 0) + 1;
    collection[date] = current;
    write(keys.log, collection);
    render();
  }
  function addSelectedDailyTask() {
    const id = q("#dailyTaskPicker").value;
    const found = id && findTask(id);
    if (!found) return;
    updateDailyTasks(items => items.some(item => item.linkedTaskId === id) ? items : [...items, { id: "daily-" + Date.now() + "-" + Math.random().toString(16).slice(2), title: found.item[0], source: found.board + " · " + found.group.group, linkedTaskId: id, completed: false, createdAt: now(), updatedAt: now() }]);
  }
  function addCustomDailyTask() {
    const title = q("#dailyTaskCustomTitle").value.trim();
    if (!title) { q("#dailyTaskCustomTitle").focus(); return; }
    q("#dailyTaskCustomTitle").value = "";
    updateDailyTasks(items => [...items, { id: "daily-" + Date.now() + "-" + Math.random().toString(16).slice(2), title: title.slice(0, 80), source: "临时任务", linkedTaskId: "", completed: false, createdAt: now(), updatedAt: now() }]);
  }
  function saveLog() {
    const collection = logs(read(keys.log)), date = q("#logDate").value || localDate(), previous = collection[date];
    const entry = Object.fromEntries(Object.entries(inputs).map(([input, field]) => [field, q("#" + input).value.trim()]));
    entry.dailyTasks = previous?.dailyTasks || [];
    entry.updatedAt = now(); entry.version = (previous?.version || 0) + 1;
    collection[date] = entry; write(keys.log, collection); render();
  }
  function weeklyMarkdown() {
    const [start, end] = weekRange(q("#logDate").value || localDate());
    const collection = logs(read(keys.log)), status = tasks(read(keys.task));
    const current = Object.entries(collection).filter(([date]) => date >= start && date <= end).sort((a, b) => a[0].localeCompare(b[0]));
    const completed = goals.flatMap(group => group.items.map(item => [group.group, item[0]])).filter(([group, name]) => status[taskId(group, name)]?.completed);
    const dailyCompleted = current.flatMap(([date, log]) => (log.dailyTasks || []).filter(item => item.completed).map(item => "- " + date.slice(5) + "：" + item.title + "（" + item.source + "）"));
    const section = (title, field, fallback) => {
      const items = current.filter(([, log]) => log[field]).map(([date, log]) => "- " + date.slice(5) + "：" + log[field]);
      return "## " + title + "\n" + (items.length ? items.join("\n") : "- " + fallback) + "\n";
    };
    return "# Q4 周复盘｜" + start + " ～ " + end + "\n\n> 本周复盘依据：每日记录、任务状态与关键协作输入。内部事实请在提交前二次核验。\n\n## 一、本周目标与关键假设（Plan）\n" + section("计划输入", "plan", "暂无记录") + "## 二、已推进事项与产出（Do）\n" + section("每日完成", "done", "暂无记录") + "### 本日待办完成\n" + (dailyCompleted.length ? dailyCompleted.join("\n") : "- 暂无已勾选的本日待办") + "\n\n### 已勾选季度任务\n" + (completed.length ? completed.map(([group, name]) => "- [x] " + group + "｜" + name).join("\n") : "- 暂无已勾选任务") + "\n\n## 三、检查：证据、学习与反馈（Check）\n" + section("关联任务 / 主题", "topic", "暂无记录") + section("学习 / 观察 / 证据", "learning", "暂无记录") + section("信息来源 / 材料链接", "source", "暂无记录") + section("导师 / 同事反馈", "feedback", "暂无记录") + section("阻塞与待协作", "blocker", "暂无记录") + "## 四、调整与下周动作（Act）\n" + section("调整决策 / 下一步", "action", "暂无记录") + "\n## 五、下周计划（待填写）\n- 本周最重要的一个交付目标：\n- 需要验证的关键假设：\n- 需要协调的资源 / 决策：\n- 预期验收证据：\n";
  }
  function download(content, filename, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
  }
  function exportWeek() {
    const [start] = weekRange(q("#logDate").value || localDate());
    download(weeklyMarkdown(), "Q4周复盘-" + start + ".md", "text/markdown;charset=utf-8");
  }
  function exportBackup() {
    const backup = { schemaVersion: 1, exportedAt: now(), app: { id: "q4-performance-wallpaper", dataFormat: "dashboard-backup" }, data: { taskStatus: tasks(read(keys.task)), dailyLogs: logs(read(keys.log)), weeklyReviews: weeks(read(keys.weekly)), customMilestones: customMilestones(read(keys.custom)), syncMeta: { lastSyncedAt: null, lastSuccessfulSyncAt: null, deviceLabel: "本机备份" } } };
    download(JSON.stringify(backup, null, 2), "q4-dashboard-backup-" + localDate() + ".json", "application/json;charset=utf-8");
  }
  function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
  function validateBackup(value) {
    if (!isObject(value) || value.schemaVersion !== 1 || !isObject(value.app) || value.app.id !== "q4-performance-wallpaper" || !isObject(value.data)) throw new Error("这不是本看板可识别的 v1 备份文件。");
    const fallback = typeof value.exportedAt === "string" ? value.exportedAt : now(), warnings = [];
    const collection = (input, type, convert) => {
      if (!isObject(input)) throw new Error(type + "格式不正确。");
      const result = {};
      Object.entries(input).forEach(([key, record]) => {
        if (type !== "任务状态" && !isDate(key)) { warnings.push("已跳过无效日期：" + key); return; }
        const normalized = convert(record, fallback);
        if (!normalized) { warnings.push("已跳过格式不正确的" + type + "：" + key); return; }
        if (type === "任务状态" && !allTaskIds.has(key)) warnings.push("备份含暂未展示的任务：" + key);
        result[key] = normalized;
      });
      return result;
    };
    const custom = customMilestones(value.data.customMilestones ?? {});
    if (value.data.customMilestones !== undefined && !isObject(value.data.customMilestones)) warnings.push("已跳过格式不正确的自定义里程碑。");
    return { taskStatus: collection(value.data.taskStatus ?? {}, "任务状态", taskRecord), dailyLogs: collection(value.data.dailyLogs ?? {}, "每日记录", logRecord), weeklyReviews: collection(value.data.weeklyReviews ?? {}, "周复盘", record => isObject(record) ? record : null), customMilestones: custom, warnings };
  }
  function conflicts(local, incoming, type) {
    return Object.keys(incoming).filter(key => local[key] && !same(local[key], incoming[key])).map(key => ({ type, key }));
  }
  function previewImport() {
    const { payload, warnings, name } = pendingImport;
    const found = [...conflicts(tasks(read(keys.task)), payload.taskStatus, "任务状态"), ...conflicts(logs(read(keys.log)), payload.dailyLogs, "每日记录"), ...conflicts(weeks(read(keys.weekly)), payload.weeklyReviews, "周复盘"), ...conflicts(customMilestones(read(keys.custom)), payload.customMilestones, "自定义里程碑")];
    pendingImport.conflicts = found;
    const dates = [...Object.keys(payload.dailyLogs), ...Object.keys(payload.weeklyReviews)].sort();
    q("#importMessage").textContent = "已读取：" + name + "。导入不会上传数据。";
    q("#importSummary").hidden = false;
    q("#importSummary").innerHTML = "<strong>备份摘要</strong><span>任务状态 " + Object.keys(payload.taskStatus).length + " 条 · 每日记录 " + Object.keys(payload.dailyLogs).length + " 条 · 周复盘 " + Object.keys(payload.weeklyReviews).length + " 条 · 自定义里程碑 " + Object.values(payload.customMilestones).flat().length + " 条</span><span>记录日期：" + (dates.length ? dates[0] + " ～ " + dates[dates.length - 1] : "无日期记录") + "</span>" + (warnings.length ? "<small>提示：" + warnings.map(esc).join("；") + "</small>" : "");
    q("#importConflicts").hidden = !found.length;
    q("#importConflicts").innerHTML = found.length ? "<strong>发现 " + found.length + " 项冲突，尚未覆盖</strong><span>" + found.slice(0, 8).map(item => item.type + "：" + esc(item.key)).join("；") + (found.length > 8 ? "；…" : "") + "</span>" : "";
    q("#importStrategy").hidden = !found.length;
    document.querySelectorAll("input[name=\"conflictStrategy\"]").forEach(input => { input.checked = false; });
    q("#confirmImport").disabled = Boolean(found.length);
  }
  function mergeLog(local, incoming) {
    const merged = {};
    fields.forEach(field => { merged[field] = local[field] || incoming[field] || ""; });
    merged.updatedAt = local.updatedAt; merged.version = Math.max(local.version || 1, incoming.version || 1) + 1;
    return merged;
  }
  function combine(local, incoming, strategy, type) {
    const result = { ...local };
    Object.entries(incoming).forEach(([key, record]) => {
      if (!result[key] || same(result[key], record)) result[key] = record;
      else if (strategy === "use-backup") result[key] = record;
      else if (strategy === "merge-fields" && type === "daily") result[key] = mergeLog(result[key], record);
    });
    return result;
  }
  function confirmImport() {
    if (!pendingImport) return;
    const strategy = document.querySelector("input[name=\"conflictStrategy\"]:checked")?.value;
    if (pendingImport.conflicts.length && !strategy) return;
    write(keys.task, combine(tasks(read(keys.task)), pendingImport.payload.taskStatus, strategy, "task"));
    write(keys.log, combine(logs(read(keys.log)), pendingImport.payload.dailyLogs, strategy, "daily"));
    write(keys.weekly, combine(weeks(read(keys.weekly)), pendingImport.payload.weeklyReviews, strategy, "weekly"));
    write(keys.custom, combine(customMilestones(read(keys.custom)), pendingImport.payload.customMilestones, strategy, "custom"));
    q("#importMessage").textContent = "导入完成，数据仅保存在当前浏览器 / 壁纸运行环境。建议继续保留原备份文件。";
    ["importSummary", "importConflicts", "importStrategy"].forEach(id => { q("#" + id).hidden = true; });
    q("#confirmImport").disabled = true; pendingImport = null; render();
  }
  function selectFile(file) {
    q("#importDialog").hidden = false;
    ["importSummary", "importConflicts", "importStrategy"].forEach(id => { q("#" + id).hidden = true; });
    q("#confirmImport").disabled = true;
    if (!file) return;
    if (file.size > maxBackupBytes) { q("#importMessage").textContent = "文件超过 5 MB，已拒绝导入。"; return; }
    const reader = new FileReader();
    reader.onerror = () => { q("#importMessage").textContent = "读取文件失败，请重新选择。"; };
    reader.onload = () => {
      try {
        const payload = validateBackup(JSON.parse(reader.result));
        pendingImport = { payload, warnings: payload.warnings, name: file.name, conflicts: [] };
        previewImport();
      } catch (error) {
        pendingImport = null; q("#importMessage").textContent = error.message || "文件格式无法识别。";
      }
    };
    reader.readAsText(file, "utf-8");
  }
  window.wallpaperPropertyListener = { applyUserProperties(properties) {
    const image = properties.background_image?.value, fit = properties.background_fit?.value;
    if (image) q("#backgroundImage").src = image;
    if (fit) q("#backgroundImage").style.objectFit = fit;
  }};
  function clock() {
    const date = new Date();
    q("#clockTime").textContent = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
    q("#clockDate").textContent = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "long", day: "numeric", weekday: "short" }).format(date);
  }
  q("#logDate").value = localDate();
  q("#openEditor").addEventListener("click", () => { q("#editor").hidden = false; renderLogs(); });
  q("#closeEditor").addEventListener("click", () => { q("#editor").hidden = true; });
  q("#logDate").addEventListener("change", renderLogs);
  q("#saveLog").addEventListener("click", saveLog);
  q("#addSelectedDailyTask").addEventListener("click", addSelectedDailyTask);
  q("#addCustomDailyTask").addEventListener("click", addCustomDailyTask);
  q("#exportWeek").addEventListener("click", exportWeek);
  q("#exportWeekInEditor").addEventListener("click", exportWeek);
  q("#openTicktick").addEventListener("click", () => { const url = q("#ticktickInput").value.trim(); if (url) window.open(url, "_blank", "noopener"); });
  q("#exportBackup").addEventListener("click", exportBackup);
  q("#selectImport").addEventListener("click", () => q("#backupFile").click());
  q("#chooseAnotherFile").addEventListener("click", () => q("#backupFile").click());
  q("#backupFile").addEventListener("change", event => { selectFile(event.target.files?.[0]); event.target.value = ""; });
  q("#closeImport").addEventListener("click", () => { q("#importDialog").hidden = true; pendingImport = null; });
  q("#confirmImport").addEventListener("click", confirmImport);
  q("#closeTaskDetail").addEventListener("click", () => { q("#taskDialog").hidden = true; activeTask = null; });
  q("#addCustomMilestone").addEventListener("click", addCustomMilestone);
  document.querySelectorAll("input[name=\"conflictStrategy\"]").forEach(input => input.addEventListener("change", () => { q("#confirmImport").disabled = false; }));
  clock(); setInterval(clock, 30000); render();
})();
