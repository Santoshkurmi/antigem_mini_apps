// Showcase's background script: AntiGem runs it in an invisible page when a background task fires,
// even with the app closed. Same SDK as the app: fetch, IndexedDB, files, localStorage, notifications.
AntiGem.background.on('check', async (task) => {
  const { uuid } = await (await fetch('https://httpbin.org/uuid')).json();

  // keep a small log the app shows on the System tab
  const runs = await AntiGem.fs.readJSON('data/bg-runs.json').catch(() => []);
  runs.push({ at: Date.now(), reason: task.reason, uuid });
  await AntiGem.fs.writeJSON('data/bg-runs.json', runs.slice(-20));

  await AntiGem.notify.show({
    title: 'Showcase ran in the background',
    body: `Task "${task.name}" (${task.reason}) fetched ${uuid.slice(0, 8)}… with the app closed.`,
    tag: 'bg-check',
  });
});

// Notification buttons pressed while the app is closed ("open": false buttons come here).
AntiGem.background.on('notification', async (task) => {
  const e = task.data || {};
  if (e.id === 'count' && e.action === 'plus') {
    await AntiGem.notify.show({ id: 'count', ongoing: true, color: '#C62828', title: 'Tea is brewing 🍵', body: 'One more minute',
      countdown: Date.now() + 60_000, actions: [{ id: 'plus', title: '+1 min', open: false }, { id: 'done', title: 'Done', open: false }] });
  } else if (['done', 'stop', 'cancel', 'read'].includes(e.action)) {
    await AntiGem.notify.dismiss(e.id);
  }
  if (e.reply) localStorage.setItem('lastReply', e.reply);
});
