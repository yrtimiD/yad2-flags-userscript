// ==UserScript==
// @name         yad2-flags
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds dedicated flag buttons for easier marking of search results
// @author       You
// @match        https://www.yad2.co.il/realestate/forsale/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=co.il
// @grant        none
// @run-at document-end
// ==/UserScript==

(function() {
    'use strict';

    const PREFIX = 'iddqd_'; //just a random text to ensure uniqueness
    const HIDDEN_CLASS = `${PREFIX}hidden`;

    const frag = document.createRange().createContextualFragment(`
	<style>
		.${HIDDEN_CLASS}{
			opacity:50%;
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
        ele.append(frag);
    }
    

    /** @param ele - item-id element */
    function initElement(ele) {
        let id = ele.getAttribute('item-id');
        addHideButton(id, ele);
        toggleHidden(id, ele, getFlag('hidden', id, false));
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
    function observeList(){
        let list = document.querySelector('.feed_list');
        if (list) {
            const observer = new MutationObserver(watchList);
            observer.observe(list, { childList: true });
        } else {
            setTimeout(observeList, 1000);
        }
    }

    // dirty+ugly but it works. TODO: find a better way to await for list changes
    setInterval(() => {if (isDirty){ document.querySelectorAll('[item-id]').forEach(ele => initElement(ele)); isDirty=false; }}, 1000);
    observeList();
})();
