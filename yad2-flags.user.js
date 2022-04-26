// ==UserScript==
// @name         yad2-flags
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Adds dedicated flag buttons for easier marking of search results. Currently "pin", "done" and "hide" flags are supported. Adding new flags is super easy.
// @author       Dmitry Gurovich
// @license      UNLICENSE
// @website      https://github.com/yrtimiD/yad2-flags-userscript
// @supportURL   https://github.com/yrtimiD/yad2-flags-userscript/issues
// @match        https://www.yad2.co.il/realestate/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yad2.co.il
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
	'use strict';

	const PREFIX = 'yad2flags'; //just a random text to ensure uniqueness

	/**
	 * Defines all available flags.
	 * To add a new flag add a new field in FLAGS and (optionally), declare a new class in the below style block.
	 */
	const FLAGS = {
		pin: { icon: '📌', tooltip:'Pin item', class:`${PREFIX}-pin`},
		done: { icon: '✅', tooltip: 'Mark item as done', class: `${PREFIX}-done` },
		hidden: { icon: '❌' /*'💩'*/, tooltip: 'Hide item', class: `${PREFIX}-hidden` },
	};

	const frag = document.createRange().createContextualFragment(`
	<style>
		.${PREFIX}-buttons {
			display: flex;
			flex-direction: column;
			justify-content: space-evenly;
			height: 85px;
		}
		.${FLAGS.pin.class}{
			border: red 2px dashed;
		}
		.${FLAGS.done.class}{
			opacity:50%;
			border: green 2px solid;
		}
		.${FLAGS.hidden.class}{
			opacity:30%;
		}
	</style>
	`);
	document.querySelector('head').append(frag);


	function setFlag(flag, id, value) {
		let data = JSON.parse(localStorage.getItem(PREFIX)) ?? {};
		(data[id] = data[id] ?? {})[flag] = value;
		localStorage.setItem(PREFIX, JSON.stringify(data));
	}

	function getFlag(flag, id, defaultValue) {
		let data = JSON.parse(localStorage.getItem(PREFIX)) ?? {};
		return data[id]?.[flag] ?? defaultValue;
	}

	function toggleFlag(flag, id, ele, value) {
		console.log(`${id} flagged with ${flag}:${value}`);
		setFlag(flag, id, value);

		let item = ele.closest(".feeditem");
		if (value === true) {
			item.classList.add(FLAGS[flag].class);
		} else {
			item.classList.remove(FLAGS[flag].class);
		}
	}

	function addButton(flag, id, ele) {
		let frag = document.createRange().createContextualFragment(`<button title="${FLAGS[flag].tooltip}">${FLAGS[flag].icon}</button>`);
		frag.children[0].addEventListener('click', (e) => { toggleFlag(flag, id, ele, !getFlag(flag, id, true)); e.stopPropagation(); });
		let container = ele.querySelector(`.${PREFIX}-buttons`);
		container.append(frag);
	}

	/** @param ele - item-id element */
	function initItemElement(ele) {
		if (ele.querySelector(`.${PREFIX}-buttons`)) return;

		ele.append(document.createRange().createContextualFragment(`<div class="${PREFIX}-buttons"></div>`));

		let id = ele.getAttribute('item-id');
		Object.keys(FLAGS).forEach(flag => {
			addButton(flag, id, ele);
			toggleFlag(flag, id, ele, getFlag(flag, id, false));
		});
	}

	let lastUpdate = 0;
	let pending = null;
	function update() {
		if (Date.now() - lastUpdate < 5000) {
			if (!pending) pending = setTimeout(update, lastUpdate + 5000 - Date.now());
			return;
		}
		lastUpdate = Date.now();
		pending = null;
		document.querySelectorAll('.feed_list [item-id]').forEach(ele => initItemElement(ele));
	}

	function startObserver() {
		const observer = new MutationObserver(() => update());
		observer.observe(document.body, { childList: true, subtree: true });

		update();
	}

	startObserver();
})();
