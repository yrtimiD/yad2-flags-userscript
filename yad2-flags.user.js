// ==UserScript==
// @name         yad2-flags
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Adds dedicated flag buttons for easier marking of search results. Currently "hide" and "done" buttons are supported.
// @author       Dmitry Gurovich
// @website	     https://github.com/yrtimiD/yad2-flags-userscript
// @supportURL   https://github.com/yrtimiD/yad2-flags-userscript/issues
// @match        https://www.yad2.co.il/realestate/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yad2.co.il
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const PREFIX = 'iddqd_'; //just a random text to ensure uniqueness
    const HIDDEN_CLASS = `${PREFIX}hidden`;
    const DONE_CLASS = `${PREFIX}done`;

    const frag = document.createRange().createContextualFragment(`
	<style>
		.${HIDDEN_CLASS}{
			opacity:50%;
		}
        .${DONE_CLASS}{
			opacity:50%;
            border: green 1px solid;
		}
        .${PREFIX}buttons {
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
            height: 85px;
        }
	</style>
	`);
    document.querySelector('head').append(frag);


    function setFlag(flag, id, value) {
        let data = JSON.parse(localStorage.getItem(PREFIX + flag)) ?? {};
        data[id] = value;
        localStorage.setItem(PREFIX + flag, JSON.stringify(data));
    }

    function getFlag(flag, id, defaultValue) {
        let data = JSON.parse(localStorage.getItem(PREFIX + flag)) ?? {};
        return data[id] ?? defaultValue;
    }

    function toggleHidden(id, ele, hidden) {
        console.log(`${id} is set to be ${hidden ? 'hidden' : 'visible'}`);
        setFlag('hidden', id, hidden);

        let item = ele.closest(".feeditem");
        if (hidden) {
            item.classList.add(HIDDEN_CLASS);
        } else {
            item.classList.remove(HIDDEN_CLASS);
        }
    }

    function addHideButton(id, ele) {
        let frag = document.createRange().createContextualFragment(`<button title="Toggle hidden flag">&#128169;</button>`);
        frag.children[0].addEventListener('click', (e) => { toggleHidden(id, ele, !getFlag('hidden', id, true)); e.stopPropagation(); });
        let container = ele.querySelector(`.${PREFIX}buttons`);
        container.append(frag);
    }

    function toggleDone(id, ele, done) {
        console.log(`${id} is set to be ${done ? 'done' : 'undone'}`);
        setFlag('done', id, done);

        let item = ele.closest(".feeditem");
        if (done) {
            item.classList.add(DONE_CLASS);
        } else {
            item.classList.remove(DONE_CLASS);
        }
    }

    function addDoneButton(id, ele) {
        let frag = document.createRange().createContextualFragment(`<button title="Toggle done flag">&#10004;</button>`);
        frag.children[0].addEventListener('click', (e) => { toggleDone(id, ele, !getFlag('done', id, true)); e.stopPropagation(); });
        let container = ele.querySelector(`.${PREFIX}buttons`);
        container.append(frag);
    }


    /** @param ele - item-id element */
    function initElement(ele) {
        ele.append(document.createRange().createContextualFragment(`<div class="${PREFIX}buttons"></div>`));

        let id = ele.getAttribute('item-id');
        addHideButton(id, ele);
        toggleHidden(id, ele, getFlag('hidden', id, false));
        addDoneButton(id, ele);
        toggleDone(id, ele, getFlag('done', id, false));
    }

    function watchList(changes) {
        console.log('feed_list changed');
        isDirty = true;
        // changes.forEach(change=>{
        //     change.addedNodes?.forEach(n=>{
        //       if (n.nodeType !== Node.ELEMENT_NODE) return;
        //       let ele = n.querySelector('[item-id]');
        //       if (ele) initElement(ele);
        //     });
        // });
    }

    let isDirty = true;
    function startObserveList(){
        let list = document.querySelector('.feed_list');
        if (list) {
            const observer = new MutationObserver(watchList);
            observer.observe(list, { childList: true });

            // dirty+ugly but it works. TODO: find a better way to await for list changes
            setInterval(() => {if (isDirty){ document.querySelectorAll('[item-id]').forEach(ele => initElement(ele)); isDirty=false; }}, 1000);
        } else {
            setTimeout(startObserveList, 1000);
        }
    }

    startObserveList();
})();
