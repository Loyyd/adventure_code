import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/utils/Controls.js', import.meta.url), 'utf8');
const { Controls } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
let controls;

beforeEach(() => {
    globalThis.document = new EventTarget();
    globalThis.window = new EventTarget();
    window.gameInterface = { inventoryUI: { isOpen: false } };
    controls = new Controls();
});

function dispatch(type, properties = {}, selectors = []) {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, properties);
    Object.defineProperty(event, 'target', {
        value: { tagName: 'DIV', closest: selector => selectors.includes(selector) }, configurable: true
    });
    document.dispatchEvent(event);
    return event;
}

test('focus loss and hidden tabs clear movement and held interaction', () => {
    for (const type of ['blur', 'visibilitychange']) {
        dispatch('keydown', { code: 'KeyW' });
        dispatch('mousedown', { button: 0 });
        if (type === 'blur') window.dispatchEvent(new Event(type));
        else {
            document.hidden = true;
            document.dispatchEvent(new Event(type));
        }
        assert.equal(controls.getMovement().moved, false);
        assert.equal(controls.isInteracting, false);
    }
});

test('releasing the mouse over UI always ends interaction', () => {
    dispatch('mousedown', { button: 0 });
    dispatch('mouseup', { button: 0 }, ['button']);
    assert.equal(controls.isInteracting, false);
});

test('inventory toggles only once per keypress and clears held input', () => {
    let toggles = 0;
    controls.onInventoryToggle = () => toggles++;
    dispatch('keydown', { code: 'KeyW' });
    dispatch('mousedown', { button: 0 });
    dispatch('keydown', { code: 'KeyI' });
    dispatch('keydown', { code: 'KeyI', repeat: true });
    assert.equal(toggles, 1);
    assert.equal(controls.getMovement().moved, false);
    assert.equal(controls.isInteracting, false);
});

test('inventory blocks movement and gathering but still allows closing', () => {
    window.gameInterface.inventoryUI.isOpen = true;
    controls.onInventoryToggle = () => window.gameInterface.inventoryUI.isOpen = false;
    dispatch('keydown', { code: 'KeyW' });
    dispatch('mousedown', { button: 0 });
    assert.equal(controls.getMovement().moved, false);
    assert.equal(controls.isInteracting, false);
    dispatch('keydown', { code: 'KeyI' });
    assert.equal(window.gameInterface.inventoryUI.isOpen, false);
});

test('hotbar clicks do not start gathering', () => {
    dispatch('mousedown', { button: 0 }, ['#hotbar']);
    assert.equal(controls.isInteracting, false);
});

test('typing and browser shortcuts do not trigger game controls', () => {
    dispatch('keydown', { code: 'KeyW' }, ['input, textarea, select, [contenteditable="true"]']);
    dispatch('keydown', { code: 'KeyD', ctrlKey: true });
    assert.equal(controls.getMovement().moved, false);
});

test('movement repeats still work without repeating debug toggles', () => {
    dispatch('keydown', { code: 'ArrowUp', repeat: true });
    assert.equal(controls.getMovement().z, -0.05);
    dispatch('keyup', { code: 'ArrowUp' });
    dispatch('keydown', { code: 'KeyP' });
    dispatch('keydown', { code: 'KeyP', repeat: true });
    assert.equal(controls.debugMode, true);
});
