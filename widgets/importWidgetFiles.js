import observer from "/webui/dist/frontend/widgets/customElementsObserver.js";
let p = [];


await Promise.allSettled(p)

observer.setCurrentLib('@gokturk413/svg-popup-dialog');
try {
await import('/webui.0.widgets/node_modules/@gokturk413/svg-popup-dialog/dist/svg_popup.js');
}catch (err) { console.error('error during import of @gokturk413/svg-popup-dialog,/webui.0.widgets/node_modules/@gokturk413/svg-popup-dialog/dist/svg_popup.js', err); }
observer.finishedCurrentLib();