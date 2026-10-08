(() => {
  const goals = [
    { group: '需求承接', weight: '15%', items: [['影视智能体迭代', '10.09–12.31', '分析 → 设计 → 评审 → 排期 → 上线'], ['软终端迭代', '10.09–12.31', '分析 → 设计 → 评审 → 排期 → 上线'], ['AI电视助手 Lite', '10.21 前', '形成差异化迭代方向文档，并跟进反馈修改']] },
    { group: '竞品分析', weight: '10%', items: [['中屏新体验对比', '10.09–10.21', '更新中屏竞品分析材料'], ['竞品专项分析', '10.22 启动', '选定终端品类，形成专题报告 + 部门分享']] },
    { group: '行业动态追踪', weight: '10%', items: [['行业动态文档', '10.09–12.31', '每周至少更新 1 版'], ['系统性调研', '10.09–12.31', '10.22 前选定方向；双周输出简报'], ['深度专题研究', '10.22–12.11', '形成专题研究报告']] },
    { group: '用户研究', weight: '5%', items: [['灵犀屏用户使用行为研究', '11.01–12.31', '形成用户研究报告']] },
    { group: '部门分享与讨论', weight: '5%', items: [['新方向讨论', '10.09–12.31', '至少 2 次，输出观点 / 会议纪要'], ['部门分享', '10.09–12.31', '至少 2 次，形成分享材料 / 记录']] }
  ];
  const milestones = [['2026-10-21', 'Lite 差异化迭代方向文档'], ['2026-10-21', '中屏新体验对比材料更新'], ['2026-10-22', '系统性调研方向确定'], ['2026-10-22', '竞品专项分析启动'], ['2026-12-11', '深度专题研究报告完成'], ['2026-12-31', 'Q4 任务闭环与材料沉淀']];
  const taskKey = 'q4-performance-task-status-v1', logKey = 'q4-performance-daily-logs-v1';
  const $ = s => document.querySelector(s);
  const localDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(d);
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const taskId = (group, name) => `${group}-${name}`;
  const esc = value => { const d = document.createElement('div'); d.textContent = value; return d.innerHTML; };
  const inputIds = ['topicInput', 'planInput', 'doneInput', 'blockerInput', 'learningInput', 'sourceInput', 'feedbackInput', 'actionInput', 'ticktickInput'];
  const logFields = { topicInput: 'topic', planInput: 'plan', doneInput: 'done', blockerInput: 'blocker', learningInput: 'learning', sourceInput: 'source', feedbackInput: 'feedback', actionInput: 'action', ticktickInput: 'ticktick' };
  function weekRange(dateString) {
    const date = new Date(`${dateString}T12:00:00`), day = date.getDay() || 7, monday = new Date(date); monday.setDate(date.getDate() - day + 1);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    return [localDate(monday), localDate(sunday)];
  }
  function render() {
    const statuses = read(taskKey, {}), all = goals.flatMap(g => g.items.map(i => taskId(g.group, i[0]))), done = all.filter(id => statuses[id]).length;
    $('#taskProgress').textContent = `${done} / ${all.length}`; $('#weekFocus').textContent = `${all.length - done} 项待推进`;
    $('#goalGroups').innerHTML = goals.map(g => `<article class="goal-group"><div class="group-head"><strong>${g.group}</strong><span>${g.weight}</span></div>${g.items.map(i => { const id = taskId(g.group, i[0]), complete = Boolean(statuses[id]); return `<button type="button" class="task ${complete ? 'done' : ''}" data-task="${id}"><i>${complete ? '✓' : ''}</i><span><b>${i[0]}</b><small>${i[1]} · ${i[2]}</small></span></button>`; }).join('')}</article>`).join('');
    document.querySelectorAll('[data-task]').forEach(button => button.addEventListener('click', () => { statuses[button.dataset.task] = !statuses[button.dataset.task]; write(taskKey, statuses); render(); }));
    const today = localDate(), next = milestones.find(m => m[0] >= today) || milestones[milestones.length - 1];
    $('#nextMilestone').textContent = `${next[0].slice(5).replace('-', '.')} ${next[1].slice(0, 7)}`; $('#milestoneHint').textContent = `下一个：${next[1]}`;
    $('#milestoneList').innerHTML = milestones.map(m => `<div class="milestone ${m[0] < today ? 'past' : ''}"><time>${m[0].slice(5).replace('-', '.')}</time><span>${m[1]}</span></div>`).join(''); renderLogs();
  }
  function renderLogs() {
    const logs = read(logKey, {}), entry = logs[$('#logDate').value || localDate()];
    $('#todayPreview').textContent = entry?.done || '今天还没有记录。用 3 分钟写下推进事项和阻塞点。';
    inputIds.forEach(id => { $(`#${id}`).value = entry?.[logFields[id]] || ''; });
    const items = Object.entries(logs).sort((a,b) => b[0].localeCompare(a[0])).slice(0, 7);
    $('#logHistory').innerHTML = items.length ? items.map(([date, log]) => `<article><time>${date}</time><p>${esc(log.done || '未填写完成事项')}</p>${log.topic ? `<small>主题：${esc(log.topic)}</small>` : ''}${log.learning ? `<small>学习：${esc(log.learning)}</small>` : ''}${log.blocker ? `<small>阻塞：${esc(log.blocker)}</small>` : ''}</article>`).join('') : '<p class="empty">尚无记录</p>';
  }
  function saveLog() {
    const logs = read(logKey, {}), date = $('#logDate').value || localDate(), entry = {};
    inputIds.forEach(id => { entry[logFields[id]] = $(`#${id}`).value.trim(); }); logs[date] = entry; write(logKey, logs); render();
  }
  function weeklyMarkdown() {
    const selectedDate = $('#logDate').value || localDate(), [start, end] = weekRange(selectedDate), logs = read(logKey, {}), statuses = read(taskKey, {});
    const weekLogs = Object.entries(logs).filter(([date]) => date >= start && date <= end).sort((a, b) => a[0].localeCompare(b[0]));
    const completed = goals.flatMap(g => g.items.map(i => [g.group, i[0]])).filter(([group, name]) => statuses[taskId(group, name)]);
    const list = (title, field, fallback) => { const rows = weekLogs.filter(([,log]) => log[field]).map(([date,log]) => `- ${date.slice(5)}：${log[field]}`); return `## ${title}\n${rows.length ? rows.join('\n') : `- ${fallback}`}\n`; };
    return `# Q4 周复盘｜${start} ～ ${end}\n\n> 本周复盘依据：每日记录、任务状态与关键协作输入。内部事实请在提交前二次核验。\n\n## 一、本周目标与关键假设（Plan）\n${list('计划输入', 'plan', '暂无记录')}\n## 二、已推进事项与产出（Do）\n${list('每日完成', 'done', '暂无记录')}\n### 已勾选任务\n${completed.length ? completed.map(([group, name]) => `- [x] ${group}｜${name}`).join('\n') : '- 暂无已勾选任务'}\n\n## 三、检查：证据、学习与反馈（Check）\n${list('关联任务 / 主题', 'topic', '暂无记录')}\n${list('学习 / 观察 / 证据', 'learning', '暂无记录')}\n${list('信息来源 / 材料链接', 'source', '暂无记录')}\n${list('导师 / 同事反馈', 'feedback', '暂无记录')}\n${list('阻塞与待协作', 'blocker', '暂无记录')}\n## 四、调整与下周动作（Act）\n${list('调整决策 / 下一步', 'action', '暂无记录')}\n\n## 五、下周计划（待填写）\n- 本周最重要的一个交付目标：\n- 需要验证的关键假设：\n- 需要协调的资源 / 决策：\n- 预期验收证据：\n`;
  }
  function exportWeek() { const [start] = weekRange($('#logDate').value || localDate()), blob = new Blob([weeklyMarkdown()], { type: 'text/markdown;charset=utf-8' }), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `Q4周复盘-${start}.md`; link.click(); URL.revokeObjectURL(url); }
  window.wallpaperPropertyListener = {
    applyUserProperties(properties) {
      const image = properties.background_image?.value, fit = properties.background_fit?.value;
      if (image) $('#backgroundImage').src = image;
      if (fit) $('#backgroundImage').style.objectFit = fit;
    }
  };
  function clock() { const d = new Date(); $('#clockTime').textContent = new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(d); $('#clockDate').textContent = new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'long',day:'numeric',weekday:'short'}).format(d); }
  $('#logDate').value = localDate(); $('#openEditor').addEventListener('click', () => { $('#editor').hidden = false; renderLogs(); }); $('#closeEditor').addEventListener('click', () => $('#editor').hidden = true); $('#logDate').addEventListener('change', renderLogs); $('#saveLog').addEventListener('click', saveLog); $('#exportWeek').addEventListener('click', exportWeek); $('#exportWeekInEditor').addEventListener('click', exportWeek); $('#openTicktick').addEventListener('click', () => { const url = $('#ticktickInput').value.trim(); if (url) window.open(url, '_blank', 'noopener'); });
  clock(); setInterval(clock, 30000); render();
})();
