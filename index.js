// ==UserScript==
// @name         Bloxflip Auto Rain
// @namespace    http://tampermonkey.net/
// @version      1.0.14
// @description  Auto join rain with Discord webhook notifications
// @author       Valentineuh
// @match        https://bloxflip.com/*
// @icon         https://bloxflip.com/favicon.ico
// @license      MIT
// @grant        GM_xmlhttpRequest
// @connect      discord.com
// @connect      api.bloxflip.com
// @downloadURL  https://update.greasyfork.org/scripts/493122/Bloxflip%20Auto%20Rain.user.js
// @updateURL    https://update.greasyfork.org/scripts/493122/Bloxflip%20Auto%20Rain.meta.js
// ==/UserScript==

window.addEventListener('load', () => {
    console.log("Script loaded.");

    const webhookUrl = 'https://discord.com/api/webhooks/1266865216302354433/DgHghGrkDOs_AoXXLI-HFIgKsrGaI2tE2KzQBBqdBBPMj_t4Pu77SZCCVD8F5MXrkZdq';
    let raining = false;

    const sendWebhookMessage = (embed) => {
        GM_xmlhttpRequest({
            method: 'POST',
            url: webhookUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ content: "<@463361051216576532>", embeds: [embed] }),
            onload: (response) => {
                if (response.status >= 200 && response.status < 300) {
                    console.log('Webhook message sent successfully.');
                } else {
                    console.error('Error sending webhook message:', response.statusText);
                }
            },
            onerror: (error) => {
                console.error('Error sending webhook message:', error);
            }
        });
    };

    const checkRainEvent = () => {
        try {
            const rainBanner = document.querySelector('.chat_chatBanner__unotk');
            if (rainBanner && rainBanner.innerText.includes("It’s about to rain!")) {
                const robuxTextElement = rainBanner.querySelector('.text_text__fMaR4.text_semibold14__cxkXo.chat_chatBannerText__iXryi');
                const robux = robuxTextElement ? robuxTextElement.childNodes[0].textContent.trim() : 'N/A';
                const participantsText = rainBanner.querySelector('.text_text__fMaR4.text_semibold14__cxkXo.chat_chatBannerText__iXryi')?.innerText || 'N/A';
                const participantsMatch = participantsText.match(/(\d+)\sparticipants/);
                const participants = participantsMatch ? participantsMatch[1] : 'N/A';
                const hostMatch = participantsText.match(/by\s(.+)$/);
                const host = hostMatch ? hostMatch[1] : 'N/A';

                console.log("Checking rain event...");
                console.log("Parsed Values - Robux:", robux, "Host:", host, "Participants:", participants);

                // Request to get expiration time
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://api.bloxflip.com/chat/history',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    onload: (response) => {
                        if (response.status >= 200 && response.status < 300) {
                            const data = JSON.parse(response.responseText);
                            const rain = data.rain;
                            const createdTime = rain.created; // Created time in milliseconds
							let expirationTimestamp = Math.round((createdTime + rain.duration) / 1000);

                            console.log("Expiration timestamp:", expirationTimestamp);
							const robux2 = robux.replace(/,/g, '');

                            if (!raining) {
                                console.log("Rain detected!");
                                const embed = {
                                    "type": "rich",
                                    "title": "💸 BLOXFLIP RAIN",
                                    "description": `[${host} is hosting a chat rain!](https://bloxflip.com)`,
                                    "color": 5814783, // Hex color code for a nice blue-green
                                    "timestamp": new Date().toISOString(),
                                    "footer": {
                                        "text": "Bloxflip Rain Bot",
                                        "icon_url": "https://bloxflip.com/favicon.ico"
                                    },
                                    "thumbnail": {
                                        "url": "https://bloxflip.com/favicon.ico"
                                    },
                                    "fields": [
                                        {
                                            "name": "Rain Amount",
                                            "value": `${robux} R$`,
                                            "inline": false
                                        },
                                        {
                                            "name": "Participants",
                                            "value": `${participants}`,
                                            "inline": false
                                        },
                                        {
                                            "name": "Host",
                                            "value": `${host}`,
                                            "inline": false
                                        },
										{
                                            "name": "Rain USD",
                                            "value": `${(robux2 * 0.0035).toFixed(2)} USD`,
                                            "inline": false
                                        },
                                        {
                                            "name": "Expiration",
                                            "value": `<t:${Math.floor(expirationTimestamp)}:R>`,
                                            "inline": false
                                        }
                                    ]
                                };
                                sendWebhookMessage(embed);
                                raining = true;

                                // Wait until the button is present and visible
                                const joinButtonCheckInterval = setInterval(() => {
                                    const joinButton = document.querySelector(".chat_chatBannerJoinButton__avNuN");
                                    if (joinButton && window.getComputedStyle(joinButton).display !== 'none') {
                                        clearInterval(joinButtonCheckInterval);
                                        joinButton.click();
                                        console.log("Clicked on join button.");

                                        // Check for participation confirmation
                                        const participationCheckInterval = setInterval(() => {
                                            const participationMessage = document.querySelector(".go3958317564");
                                            if (participationMessage && participationMessage.innerText.includes("You're now participating in this chat rain event!")) {
                                                clearInterval(participationCheckInterval);
                                                console.log("Successfully joined chat rain.");
                                                sendWebhookMessage({
                                                    "type": "rich",
                                                    "title": "💸 BLOXFLIP RAIN",
                                                    "description": "Successfully joined the chat rain event!",
                                                    "color": 5814783,
                                                    "timestamp": new Date().toISOString(),
                                                    "footer": {
                                                        "text": "Bloxflip Rain Bot",
                                                        "icon_url": "https://bloxflip.com/favicon.ico"
                                                    }
                                                });
                                            } else if (Date.now() >= expirationTimestamp * 1000) {
                                                clearInterval(participationCheckInterval);
                                                console.log("Failed to join chat rain before it expired.");
                                                sendWebhookMessage({
                                                    "type": "rich",
                                                    "title": "💸 BLOXFLIP RAIN",
                                                    "description": "Failed to join the chat rain event before it expired.",
                                                    "color": 16711680,
                                                    "timestamp": new Date().toISOString(),
                                                    "footer": {
                                                        "text": "Bloxflip Rain Bot",
                                                        "icon_url": "https://bloxflip.com/favicon.ico"
                                                    }
                                                });
                                            }
                                        }, 1000); // Check every second
                                    } else {
                                        console.log("Join button not found or not visible yet.");
                                    }
                                }, 1000); // Check every second
                            }
                        } else {
                            console.error('Error fetching chat history:', response.statusText);
                        }
                    },
                    onerror: (error) => {
                        console.error('Error fetching chat history:', error);
                    }
                });

            } else if (raining) {
                raining = false;
            }
        } catch (error) {
            console.error('Error checking rain event:', error);
        }
    };

    setInterval(checkRainEvent, 5000);

    setInterval(() => {
        try {
            console.log("Checking balance...");
            const userBalance = document.querySelector('.header_headerUserBalance__mNiaf');
            if (userBalance) {
                const balance = userBalance.querySelector('span').textContent;
                console.log("Balance:", balance);
            } else {
                console.log("User balance element not found.");
            }
        } catch (error) {
            console.error('Error checking balance:', error);
        }
    }, 600000);
});
