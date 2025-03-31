import { Application } from "@splinetool/runtime";

// START

loadScriptsAndRun();

// CLASSES

class ItemInfiniteSlider {
    constructor(node, index, allNodes) {
        this.node = node;
        this.index = index;
        this.allNodes = allNodes;

        this.length = allNodes.length;
    }

    setupHoverAnimation() {
        this.tl = gsap.timeline({ paused: true });

        const videoSource = this.node.querySelector("source");

        if (videoSource.getAttribute("src").length) {
            this.tl
                .to(this.node.querySelector("video.side-media"), {
                    y: -vw(
                        parseFloat(
                            getComputedStyle(
                                document.documentElement
                            ).getPropertyValue("--spacing--dynamic-base")
                        )
                    ),
                    duration: 0.5,
                    ease: "power2.out",
                })
                .to(
                    infiniteSlider,
                    {
                        sliderAutoSpeed: 0.5,
                        duration: 1,
                        ease: "power2.out",
                    },
                    0
                )
                .addPause();

            this.exitTime = this.tl.duration();

            this.tl
                .to(this.node.querySelector("video.side-media"), {
                    y: 0,
                    duration: 0.5,
                    ease: "power2.out",
                })
                .to(
                    infiniteSlider,
                    {
                        sliderAutoSpeed: 2,
                        duration: 1,
                        ease: "power2.out",
                    },
                    1
                );
        } else {
            this.tl
                .to(this.node.querySelector("img.side-media"), {
                    y: -vw(
                        parseFloat(
                            getComputedStyle(
                                document.documentElement
                            ).getPropertyValue("--spacing--dynamic-base")
                        )
                    ),
                    duration: 0.5,
                    ease: "power2.out",
                })
                .to(
                    infiniteSlider,
                    {
                        sliderAutoSpeed: 0.5,
                        duration: 1,
                        ease: "power2.out",
                    },
                    0
                )
                .addPause();

            this.exitTime = this.tl.duration();

            this.tl
                .to(this.node.querySelector("img.side-media"), {
                    y: 0,
                    duration: 0.5,
                    ease: "power2.out",
                })
                .to(
                    infiniteSlider,
                    {
                        sliderAutoSpeed: 2,
                        duration: 1,
                        ease: "power2.out",
                    },
                    1
                );
        }

        this.addEventListeners();
    }

    addEventListeners() {
        setupMouseEnterLeaveAnimationFor(this.node, this.tl, this.exitTime);
    }

    onResize() {
        this.padding = vw(
            parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue(
                    "--spacing--dynamic-base"
                )
            )
        );

        this.width = this.node.getBoundingClientRect().width + this.padding;
        this.widthTotal = 0;
        this.allNodes.forEach((node) => {
            this.widthTotal +=
                node.getBoundingClientRect().width + this.padding;
        });

        this.x = this.padding * this.index;

        this.extra = 0;

        this.isBefore = this.node.getBoundingClientRect().right < 0;
        this.isAfter =
            this.node.getBoundingClientRect().left > window.innerWidth;

        if (this.isBefore) {
            this.extra -= this.widthTotal;
        } else if (this.isAfter) {
            this.extra += this.widthTotal;
        }

        this.setTransform({ current: 0 });
    }

    rescale(scale) {
        gsap.to(this.node, {
            scale: scale,
            duration: 0.5,
            ease: "power2.out",
        });
    }

    update(scroll, direction) {
        this.setTransform(scroll);

        this.isBefore = this.node.getBoundingClientRect().right < 0;
        this.isAfter =
            this.node.getBoundingClientRect().left > window.innerWidth;

        if (direction === "right" && this.isBefore) {
            this.extra -= this.widthTotal;

            this.isBefore = false;
            this.isAfter = false;
        }

        if (direction === "left" && this.isAfter) {
            this.extra += this.widthTotal;

            this.isBefore = false;
            this.isAfter = false;
        }
    }

    setTransform(scroll) {
        const positionX = this.x - scroll.current - this.extra;

        gsap.set(this.node, {
            x: positionX,
        });
    }
}

class InfiniteSlider {
    constructor(wrapperElement, itemsNodes) {
        this.wrapperElement = wrapperElement;

        this.items = [...itemsNodes].map((node, index) => {
            const item = new ItemInfiniteSlider(node, index, itemsNodes);

            return item;
        });

        this.isSizeReduced = false;
        this.isKeyPressed = false;
        this.isItemOpened = false;
        this.isScrubTlCompleted = false;

        this.direction = "";

        this.delayBeforeNext = 0.1;

        this.bindOnKeyDown = this.onKeyDown.bind(this);
        this.bindOnKeyUp = this.onKeyUp.bind(this);

        this.addEventListeners();

        this.onResize();
    }

    onResize() {
        this.scroll = {
            ease: !window.matchMedia("(any-pointer: coarse)").matches
                ? 0.08
                : 0.1,
            current: 0,
            target: 0,
            last: 0,
        };

        this.isDown = false;
        this.startX = 0;
        this.startY = 0;
        this.isTouchDetermined = false;
        this.isHorizontal = false;
        this.touchSpeed = !window.matchMedia("(any-pointer: coarse)").matches
            ? 1.5
            : 2;
        this.sliderAutoSpeed = 2;

        this.items.forEach((item) => item.onResize());
    }

    update() {
        if (this.isScrubTlCompleted) {
            if (
                !this.isSizeReduced &&
                !this.isKeyPressed &&
                !this.isItemOpened
            ) {
                this.scroll.target += this.sliderAutoSpeed;
            }

            this.scroll.current = lerp(
                this.scroll.current,
                this.scroll.target,
                this.scroll.ease
            );

            if (this.scroll.current > this.scroll.last) {
                this.direction = "right";
            } else {
                this.direction = "left";
            }

            this.items.forEach((item) => {
                item.update(this.scroll, this.direction);
            });

            this.scroll.last = this.scroll.current;
        } else {
            if (
                gsap.getProperty(this.wrapperElement, "pointerEvents") === "all"
            ) {
                gsap.set(this.wrapperElement, { pointerEvents: "none" });
            }
        }
    }

    addEventListeners() {
        window.addEventListener("keydown", this.bindOnKeyDown);
        window.addEventListener("keyup", this.bindOnKeyUp);

        this.wrapperElement.addEventListener(
            "mousedown",
            this.onTouchDown.bind(this)
        );
        this.wrapperElement.addEventListener(
            "mousemove",
            this.onMouseMove.bind(this)
        );
        this.wrapperElement.addEventListener(
            "mouseup",
            this.onTouchUp.bind(this)
        );
        this.wrapperElement.addEventListener(
            "mouseleave",
            this.onMouseLeave.bind(this)
        );

        this.wrapperElement.addEventListener(
            "touchstart",
            this.onTouchDown.bind(this),
            { passive: true }
        );
        this.wrapperElement.addEventListener(
            "touchmove",
            this.onTouchMove.bind(this),
            { passive: true }
        );
        this.wrapperElement.addEventListener(
            "touchend",
            this.onTouchUp.bind(this),
            { passive: true }
        );
    }

    removeEventListeners() {
        window.removeEventListener("keydown", this.bindOnKeyDown);
        window.removeEventListener("keyup", this.bindOnKeyUp);
    }

    onTouchDown(event) {
        if (this.isItemOpened) return;

        this.wrapperElement.classList.add("is-pointer-down");

        this.isDown = true;

        if (!this.isSizeReduced) {
            this.isSizeReduced = true;

            // if not touch device
            if (!window.matchMedia("(any-pointer: coarse)").matches) {
                this.items.forEach((item) => {
                    item.rescale(0.9);
                });
            }
        }

        this.scroll.position = this.scroll.current;

        this.startX = event.touches ? event.touches[0].clientX : event.clientX;
        this.startY = event.touches ? event.touches[0].clientY : event.clientY;
    }

    onMouseMove(event) {
        if (!this.isDown || window.matchMedia("(any-pointer: coarse)").matches)
            return;

        this.wrapperElement.classList.add("is-dragging");

        const x = event.touches ? event.touches[0].clientX : event.clientX;
        const distanceX = this.startX - x;

        this.scroll.target = this.scroll.position + distanceX * this.touchSpeed;
    }

    onTouchMove(event) {
        if (!this.isDown) return;

        this.wrapperElement.classList.add("is-dragging");

        const x = event.touches ? event.touches[0].clientX : event.clientX;
        const distanceX = this.startX - x;

        const y = event.touches ? event.touches[0].clientY : event.clientY;
        const distanceY = this.startY - y;

        if (!this.isTouchDetermined) {
            this.isHorizontal = Math.abs(distanceX) > Math.abs(distanceY);

            this.isTouchDetermined = true;
        }

        if (this.isHorizontal) {
            lenis.stop();
            this.scroll.target =
                this.scroll.position + distanceX * this.touchSpeed;
        } else {
            this.onTouchUp();
        }
    }

    onTouchUp() {
        if (lenis.isStopped) {
            lenis.start();
        }

        this.wrapperElement.classList.remove("is-pointer-down");
        this.wrapperElement.classList.remove("is-dragging");

        // if not touch device
        if (!window.matchMedia("(any-pointer: coarse)").matches) {
            this.items.forEach((item) => {
                item.rescale(1);
            });
        }

        this.isSizeReduced = false;

        this.isDown = false;
        this.isTouchDetermined = false;
    }

    onMouseLeave() {
        if (this.isDown) {
            this.onTouchUp();
        }
    }

    onKeyDown(event) {
        if (this.isDown || this.isItemOpened) return;

        const { width } = this.items[0];

        switch (event.code) {
            case "ArrowLeft":
                this.isKeyPressed = true;

                gsap.delayedCall(this.delayBeforeNext, () => {
                    gsap.set(this.scroll, {
                        target: `-=${width}`,
                    });
                });

                break;
            case "ArrowRight":
                this.isKeyPressed = true;

                gsap.delayedCall(this.delayBeforeNext, () => {
                    gsap.set(this.scroll, {
                        target: `+=${width}`,
                    });
                });

                break;
            default:
                break;
        }
    }

    onKeyUp(event) {
        if (this.isDown || this.isItemOpened) return;

        switch (event.code) {
            case "ArrowLeft":
            case "ArrowRight":
                gsap.delayedCall(1, () => {
                    this.isKeyPressed = false;
                });

                this.onCheck();

                break;
            default:
                break;
        }
    }

    onCheck() {
        const { width } = this.items[0];
        const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
        const item = width * itemIndex;

        if (this.scroll.target < 0) {
            this.scroll.target = -item;
        } else {
            this.scroll.target = item;
        }
    }
}

// GLOBAL DECLARATIONS

const namespaces = { HOME: "home", PROJECT: "project", NOT_FOUND: "404" };

let lenis, logoColorTl, preloaderLoadingTl;

let isRunning = true;

history.scrollRestoration = "manual";

const vw = (coef) =>
    Math.max(document.documentElement.clientWidth, window.innerWidth || 0) *
    (coef / 100);

let windowWidth = window.innerWidth;

let progress = document.querySelector(".progress");

let infiniteSlider = null;

let preloaderLoaded = false;
let pageLoaded = false;

let mm;
let currentPage = null;
let currentSplineApps = [];
const splitTypeObj = {};

const accentColor = getComputedStyle(document.documentElement).getPropertyValue(
    "--color--accent"
);
const lightColor = getComputedStyle(document.documentElement).getPropertyValue(
    "--color--light"
);
const darkColor = getComputedStyle(document.documentElement).getPropertyValue(
    "--color--dark"
);

// FUNCTIONS

async function loadScriptsAndRun() {
    try {
        await loadScript("https://unpkg.com/lenis@1.1.18/dist/lenis.min.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@barba/core");
        await loadScript("https://cdn.jsdelivr.net/npm/@barba/prefetch");
        await loadScript(
            "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"
        );
        await loadScript(
            "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"
        );
        await loadScript(
            "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Flip.min.js"
        );
        await loadScript(
            "https://cdn.jsdelivr.net/gh/kall0m/kall0m.github.io/src/external/split-type.js"
        );
        // await loadScript(
        //     "https://cdn.jsdelivr.net/npm/@splinetool/runtime@1.9.42/runtime.d.ts"
        // );

        // After all scripts are loaded, run the function
        init();
    } catch (error) {
        console.error(error);
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");

        script.src = src;

        script.setAttribute("defer", "");

        script.onload = resolve;

        script.onerror = (e) => reject(new Error(`Failed to load ${src} ${e}`));

        document.body.appendChild(script);
    });
}

function init() {
    addEventListeners();

    // BARBA

    barba.use(barbaPrefetch);

    barba.init({
        // debug: true,
        timeout: 20000,
        preventRunning: true,
        transitions: [
            {
                name: "preloader",
                beforeOnce() {
                    // console.log("beforeOnce");

                    setupPreloader();
                },
                async once() {
                    // console.log("once");

                    setupNavbar();

                    const preloaderInitTL = gsap.timeline({
                        paused: true,
                        delay: 0,
                        onStart: () => {
                            gsap.set(".loading", { autoAlpha: 0 });
                            preloaderLoadingTl.play();
                        },
                    });

                    animateOverlay(
                        ".preloader-title",
                        preloaderInitTL,
                        1,
                        0,
                        0
                    );
                    animateOverlay(
                        ".preloader-subtitle",
                        preloaderInitTL,
                        1,
                        0.25,
                        0
                    );

                    await preloaderInitTL.play();
                },
            },
            {
                name: "base transition",
                to: {
                    namespace: [
                        namespaces.HOME,
                        namespaces.PROJECT,
                        namespaces.NOT_FOUND,
                    ],
                },
                async leave() {
                    // console.log("transition leave");

                    if (currentPage === namespaces.HOME) {
                        infiniteSlider.removeEventListeners();
                        infiniteSlider = null;
                        stop();
                    }

                    await getTransitionAppearTl()
                        .play()
                        .then(() => {
                            cleanGSAP();

                            if (
                                gsap.getProperty(".mobile-menu", "display") !==
                                "none"
                            ) {
                                const closeMenuButton =
                                    document.querySelector(".nav-item-close");
                                closeMenuButton.click();
                            }
                        });
                },
                async after() {
                    // console.log("transition after");

                    await getTransitionLeaveTl().play();
                },
            },
        ],
        views: [
            {
                namespace: namespaces.HOME,
                afterLeave() {
                    // console.log("home afterLeave");

                    disposeSplineCanvases();
                },
                beforeEnter() {
                    // console.log("home beforeEnter");

                    window.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: "instant",
                    });
                    lenis.scrollTo("top", { duration: 0.1, force: true });

                    currentPage = namespaces.HOME;

                    setupHeroHome();
                    setupCases();
                    setupAbout();
                    setupContact();
                },
                async afterEnter(data) {
                    // console.log("home afterEnter");

                    window.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: "instant",
                    });
                    lenis.scrollTo("top", { duration: 0.1, force: true });

                    gsap.set(".navbar .logo-text", {
                        color: "var(--color--dark)",
                    });

                    await setupSplineCanvases(data.next.container);
                },
            },
            {
                namespace: namespaces.PROJECT,
                afterLeave() {
                    // console.log("project afterLeave");

                    disposeSplineCanvases();
                },
                beforeEnter() {
                    // console.log("project beforeEnter");

                    stop();

                    window.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: "instant",
                    });
                    lenis.scrollTo("top", { duration: 0.1, force: true });

                    currentPage = namespaces.PROJECT;

                    setupHeroProject();
                    setupContent();
                },
                async afterEnter(data) {
                    // console.log("project afterEnter");

                    window.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: "instant",
                    });
                    lenis.scrollTo("top", { duration: 0.1, force: true });

                    gsap.set(".navbar .logo-text", {
                        color: "var(--color--dark)",
                    });

                    await setupSplineCanvases(data.next.container);
                },
            },
            {
                namespace: namespaces.NOT_FOUND,
                afterLeave() {
                    // console.log("404 afterLeave");

                    disposeSplineCanvases();

                    gsap.set(".logo-text", { color: "var(--color--dark)" });
                },
                beforeEnter() {
                    // console.log("404 beforeEnter");

                    stop();

                    currentPage = namespaces.NOT_FOUND;

                    setup404();
                },
                async afterEnter(data) {
                    // console.log("404 afterEnter");

                    gsap.set(".navbar .logo-text", {
                        color: "var(--color--accent)",
                    });

                    await setupSplineCanvases(data.next.container);
                },
            },
        ],
    });

    barba.hooks.afterEnter(() => {
        // console.log("global afterEnter");

        removeBadge();

        if (!window.matchMedia("(any-pointer: coarse)").matches) {
            let vids = document.querySelectorAll("video");

            vids.forEach((vid) => {
                if (vid && vid.hasAttribute("autoPlay")) {
                    let playPromise = vid.play();

                    if (playPromise !== undefined) {
                        playPromise.then((_) => {}).catch((error) => {});
                    }

                    ScrollTrigger.create({
                        trigger: vid,
                        start: "top bottom",
                        invalidateOnRefresh: true,
                        end: "bottom top",
                        onEnter: () => {
                            playPromise = vid.play();

                            if (playPromise !== undefined) {
                                playPromise
                                    .then((_) => {})
                                    .catch((error) => {});
                            }
                        },
                        onLeave: () => {
                            playPromise = vid.play();

                            if (playPromise !== undefined) {
                                playPromise
                                    .then((_) => {
                                        vid.pause();
                                    })
                                    .catch((error) => {});
                            }
                        },
                        onEnterBack: () => {
                            playPromise = vid.play();

                            if (playPromise !== undefined) {
                                playPromise
                                    .then((_) => {})
                                    .catch((error) => {});
                            }
                        },
                        onLeaveBack: () => {
                            playPromise = vid.play();

                            if (playPromise !== undefined) {
                                playPromise
                                    .then((_) => {
                                        vid.pause();
                                    })
                                    .catch((error) => {});
                            }
                        },
                        // markers: true,
                    });
                }
            });
        }
    });

    barba.hooks.after(() => {
        gsap.delayedCall(2, () => {
            // console.log("removing badge");
            removeBadge();
        });

        resetWebflow(data);
    });

    // LENIS

    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.stop();

    lenis.on("scroll", ScrollTrigger.update);

    lenis.on("scroll", (e) => {
        if (progress) {
            gsap.set(progress, { scaleY: e.progress });
        }
    });

    // GSAP

    gsap.registerPlugin(ScrollTrigger);
    gsap.registerPlugin(Flip);

    mm = gsap.matchMedia();

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    logoColorTl = gsap.timeline({ paused: true }).fromTo(
        ".navbar .logo-text",
        {
            color: "var(--color--dark)",
        },
        {
            color: "var(--color--light)",
            duration: 0.5,
            ease: "power2.out",
        }
    );

    preloaderLoadingTl = gsap
        .timeline({ paused: true })
        .to(".loading", { autoAlpha: 1, duration: 0.5, ease: "power4.in" }, 0)
        .to(
            ".loading",
            {
                rotation: 360,
                duration: 4,
                ease: "none",
                repeat: -1,
            },
            0
        );

    // ON LOAD

    window.onload = () => {
        // console.log("page loaded");

        /* Pinterest */
        // Create a new meta element
        const meta = document.createElement("meta");

        // Set the attributes for the meta element
        meta.name = "p:domain_verify";
        meta.content = "59d27bbd792fbfa06c327c97bdd26810";

        // Append the meta element to the <head> section
        document.head.appendChild(meta);

        var css = ".w-webflow-badge { display: none !important; }",
            head = document.head || document.getElementsByTagName("head")[0],
            style = document.createElement("style");

        head.appendChild(style);

        style.type = "text/css";
        if (style.styleSheet) {
            // This is required for IE8 and below.
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

        console.log(
            "%cKaloyan Madzhunov—Web Designer and Interactive Developer\n\n%cWelcome to the tea party! ☕ Curiosity led you here… but only the truly MAD would stay. 🎩 Now, tell me, will you go further down the rabbit hole? 🐇🍄✨",
            `color: ${lightColor}; font-weight: bold;`,
            `background: ${darkColor}; color: ${accentColor}; display: block; padding: 4px 8px; border-radius: 4px; font-style: italic;`
        );

        pageLoaded = true;
        checkLoadingCompletion();
    };
}

function lerp(p1, p2, t) {
    return p1 + (p2 - p1) * t;
}

function setupMouseEnterLeaveAnimationFor(element, timeline, exitTime) {
    mm.add("(any-pointer: fine)", (context) => {
        context.add("onMouseenter", () => {
            if (timeline.time() < exitTime) {
                timeline.play();
            } else {
                timeline.restart();
            }
        });
        element.addEventListener("mouseenter", context.onMouseenter);

        context.add("onMouseleave", () => {
            if (timeline.time() < exitTime) {
                timeline.reverse();
            } else {
                timeline.play();
            }
        });
        element.addEventListener("mouseleave", context.onMouseleave);

        return () => {
            element.removeEventListener("mouseenter", context.onMouseenter);
            element.removeEventListener("mouseleave", context.onMouseleave);
        };
    });
}

function replaceDivWithButton(div, buttonTitle) {
    const button = document.createElement("button");

    gsap.set(button, {
        background: "none",
        outline: "none",
        boxShadow: "none",
    });

    button.title = buttonTitle;
    button.id = div.id;
    button.classList = div.classList;
    button.innerHTML = div.innerHTML;

    div.parentNode.replaceChild(button, div);

    return button;
}

function createImageScrollReveal(selector) {
    gsap.utils.toArray(selector).forEach((image) => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: image,
                start: "top bottom",
                toggleActions: `play none none reset`,
                // markers: true,
            },
        });

        tl.fromTo(
            image,
            {
                scale: 1.2,
            },
            {
                scale: 1,
                duration: 1.5,
                ease: "power2.out",
            }
        );
    });
}

function createLinkZoomOnParentHover(selector) {
    // Check if fine pointer (device that can hover) is present
    mm.add(
        "(any-pointer: fine) and (prefers-reduced-motion: no-preference)",
        (context) => {
            gsap.utils.toArray(selector).forEach((parent) => {
                // Find the link child within the parent
                const link = parent.querySelector("a");
                if (!link) return () => {}; // Skip if no image is found

                context.add("onMouseEnter", () => {
                    gsap.to(link, {
                        scale: 1.02,
                        duration: 0.5,
                        ease: "power2.out",
                    });
                });

                parent.addEventListener("mouseenter", context.onMouseEnter);

                context.add("onMouseLeave", () => {
                    gsap.to(link, {
                        scale: 1,
                        duration: 0.5,
                        ease: "power2.out",
                    });
                });

                parent.addEventListener("mouseleave", context.onMouseLeave);
            });

            return () => {
                parent.removeEventListener("mouseenter", context.onMouseEnter);
                parent.removeEventListener("mouseleave", context.onMouseLeave);
            };
        }
    );
}

function createUnderline(selector, { color, small }) {
    document.querySelectorAll(selector).forEach((element) => {
        const underline = document.createElement("div");
        underline.classList.add("link-underline");

        gsap.set(underline, {
            backgroundColor: color,
        });

        if (small) {
            gsap.set(underline, {
                height: 1,
                marginTop: "-2px",
            });
        }

        element.appendChild(underline);

        const tlUnderline = gsap
            .timeline({ paused: true })
            .to(underline, {
                scaleX: 0,
                duration: 0.5,
                ease: "power2.inOut",
                onStart: () => {
                    gsap.set(underline, {
                        transformOrigin: "right center",
                    });
                },
            })
            .to(underline, {
                scaleX: 1,
                duration: 0.5,
                ease: "power2.inOut",
                onStart: () => {
                    gsap.set(underline, {
                        transformOrigin: "left center",
                    });
                },
            });

        element.addEventListener("mouseenter", () => {
            if (tlUnderline.time() < tlUnderline.duration()) {
                tlUnderline.play();
            } else {
                tlUnderline.restart();
            }
        });
    });
}

function setupSplitTypeFor(selector, types = "lines") {
    const split = new SplitType(selector, {
        tagName: "div",
        types: types,
    });

    splitTypeObj[selector] = split;
}

function setupOpacityScrollRevealFor(selector) {
    document.querySelectorAll(selector).forEach((element) => {
        const tl = gsap.timeline({
            // paused: true,
            scrollTrigger: {
                trigger: element,
                start: "top bottom",
                toggleActions: `play none none reset`,
                // markers: true,
            },
        });

        tl.fromTo(
            element,
            {
                autoAlpha: 0,
            },
            {
                autoAlpha: 1,
                duration: 1.5,
                ease: "power2.out",
            }
        );
    });
}

function setupTextScrollRevealFor(selector) {
    gsap.utils.toArray(selector).forEach((element) => {
        gsap.set(element, {
            // overflow: "hidden",
        });

        gsap.utils
            .toArray(element.querySelectorAll(".line, .word"))
            .forEach((type) => {
                const tl = gsap.timeline({
                    // paused: true,
                    scrollTrigger: {
                        trigger: element,
                        start: "top bottom",
                        toggleActions: `play none none reset`,
                        // markers: true,
                    },
                });

                tl.fromTo(
                    type,
                    {
                        yPercent: 50,
                        autoAlpha: 0,
                    },
                    {
                        yPercent: 0,
                        autoAlpha: 1,
                        duration: 1.5,
                        ease: "power2.out",
                    }
                );
            });
    });
}

function setupMediaScrollRevealFor(selector) {
    gsap.utils.toArray(selector).forEach((element) => {
        const tl = gsap.timeline({
            // paused: true,
            scrollTrigger: {
                trigger: element,
                start: "top bottom",
                end: "top 50%",
                toggleActions: "play none none none",
                invalidateOnRefresh: true,
                scrub: 1,
                once: true,
                // markers: true,
            },
        });

        gsap.set(element, { transformOrigin: "top center" });

        tl.fromTo(
            element,
            {
                scaleX: () =>
                    window.innerWidth / element.getBoundingClientRect().width,
                scaleY: () =>
                    window.innerWidth / element.getBoundingClientRect().width,
                y: getComputedStyle(document.documentElement).getPropertyValue(
                    "--spacing--dynamic-base"
                ),
            },
            {
                scaleX: 1,
                scaleY: 1,
                y: 0,
                ease: "none",
            }
        );
    });
}

function createOverlay(isOverlayHorizontal = false) {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");

    if (isOverlayHorizontal) {
        overlay.classList.add("overlay-x");
        gsap.set(overlay, { xPercent: 0, x: 0 });
    } else {
        gsap.set(overlay, { yPercent: 0, y: 0 });
    }

    return overlay;
}

function setupOverlay(selector, isOverlayHorizontal = false) {
    gsap.utils.toArray(selector).forEach((element) => {
        gsap.utils
            .toArray(element.querySelectorAll(".line, .word"))
            .forEach((type) => {
                gsap.set(type, {
                    // overflow: "hidden",
                    position: "relative",
                });

                const content = document.createElement("span");
                content.classList.add("content");
                content.innerHTML = type.innerHTML;

                type.innerHTML = "";
                type.appendChild(content);

                gsap.set(content, {
                    scale: 1,
                    display: "inline-block",
                });

                const overlay = createOverlay(isOverlayHorizontal);
                type.appendChild(overlay);
            });
    });
}

function setupPreloader() {
    gsap.set(".preloader", {
        height: window.innerHeight,
    });

    setupSplitTypeFor(".preloader-title, .preloader-subtitle");
    setupOverlay(".preloader-title, .preloader-subtitle");

    gsap.set(".preloader-title, .preloader-subtitle", { autoAlpha: 1 });
    gsap.set(".preloader-title .overlay, .preloader-subtitle .overlay", {
        backgroundColor: gsap.getProperty(".wipe-main", "backgroundColor"),
    });
    gsap.utils.toArray(".loading svg circle").forEach((circle) => {
        circle.setAttribute("stroke", "currentColor");
    });
}

function adjustNavbarRelatedLayout() {
    // Set nav shapes height
    const navItemsHeight = document
        .querySelector(".nav-items")
        .getBoundingClientRect().height;
    const navShapes = document.querySelectorAll(".nav-shape");
    navShapes.forEach((shape) => {
        shape.style.width = `${navItemsHeight}px`;
        shape.style.height = `${navItemsHeight}px`;
    });
}

function adjustHomePadding() {
    const spacing = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
            "--spacing--dynamic-base"
        )
    );

    // Set other sections padding top
    const navWrapperHeight = document
        .querySelector(".nav-wrapper")
        .getBoundingClientRect().height;

    document.querySelector(".section-hero").style.paddingTop = `${
        navWrapperHeight + vw(spacing)
    }px`;
    document.querySelector(".section-services").style.paddingTop = `${
        navWrapperHeight + vw(spacing)
    }px`;
    document.querySelector(".section-cases").style.paddingTop = `${
        navWrapperHeight + vw(spacing)
    }px`;
    document.querySelector(".section-contact").style.paddingTop = `${
        navWrapperHeight + vw(spacing)
    }px`;
}

function createMobileMenuTl() {
    const tl = gsap
        .timeline({
            paused: true,
            onStart: () => {
                lenis.stop();
            },
            onReverseComplete: () => {
                lenis.start();
            },
        })
        .set(".mobile-menu", { display: "none" })
        .set(".mobile-menu", { display: "grid", yPercent: -105 })
        .set(".nav-item-close", { autoAlpha: 0 })
        .set(".nav-wrapper", { yPercent: 0 })
        .to(
            ".nav-wrapper",
            {
                yPercent: -105,
                duration: 0.25,
                ease: "power2.in",
            },
            0
        )
        .to(
            ".mobile-menu",
            {
                yPercent: 0,
                duration: 0.5,
                ease: "power2.inOut",
            },
            0.25
        );

    animateOverlay(
        ".mobile-nav-items .nav-item-text",
        tl,
        0.5,
        tl.duration(),
        0.1
    );

    animateOverlay(".mobile-menu-footer-text", tl, 0.5, tl.duration() - 0.5, 0);

    tl.to(
        ".nav-item-close",
        {
            autoAlpha: 1,
            duration: 0.25,
            ease: "power2.out",
        },
        tl.duration() - 0.5
    );

    return tl;
}

function setupMobileMenu() {
    setupSplitTypeFor(".mobile-nav-items .nav-item-text");
    setupOverlay(".mobile-nav-items .nav-item-text");

    setupSplitTypeFor(".mobile-menu-footer-text");
    setupOverlay(".mobile-menu-footer-text");

    gsap.set(".mobile-menu", {
        height: window.innerHeight,
    });

    gsap.set(".mobile-nav-items .overlay, .mobile-menu-footer-text .overlay", {
        backgroundColor: gsap.getProperty(".mobile-menu", "backgroundColor"),
    });

    const openMenuDiv = document.querySelector(".nav-item-open");
    const openMenuButton = replaceDivWithButton(openMenuDiv, "Open Menu");

    gsap.set(".nav-item-open .overlay", { yPercent: -105, y: 0 });

    const closeMenuDiv = document.querySelector(".nav-item-close");
    const closeMenuButton = replaceDivWithButton(closeMenuDiv, "Close Menu");

    const mobileMenuTl = createMobileMenuTl();

    openMenuButton.addEventListener("click", () => {
        mobileMenuTl.play();
    });

    closeMenuButton.addEventListener("click", () => {
        mobileMenuTl.reverse();
    });
}

function setupNavbar() {
    setupSplitTypeFor(".navbar .logo-text");
    setupOverlay(".navbar .logo-text");

    setupSplitTypeFor(".nav-items .nav-item-text");
    setupOverlay(".nav-items .nav-item-text");

    gsap.set(".nav-items .nav-item-text .overlay", {
        backgroundColor: gsap.getProperty(".nav-items", "backgroundColor"),
    });

    // Create nav wrapper overlay
    const navWrapper = document.querySelector(".nav-wrapper");
    const overlay = createOverlay();
    navWrapper.appendChild(overlay);

    gsap.set(".logo-text .overlay", {
        backgroundColor: gsap.getProperty(
            ".section:first-of-type",
            "backgroundColor"
        ),
    });

    gsap.set(".nav-wrapper > .overlay", {
        backgroundColor: gsap.getProperty(
            ".section:first-of-type",
            "backgroundColor"
        ),
    });

    // Set nav shapes height
    const navItemsHeight = document
        .querySelector(".nav-items")
        .getBoundingClientRect().height;
    const navShapes = document.querySelectorAll(".nav-shape");
    navShapes.forEach((shape) => {
        shape.style.width = `${navItemsHeight}px`;
        shape.style.height = `${navItemsHeight}px`;
    });

    setupMobileMenu();

    adjustNavbarRelatedLayout();
}

function setupInfiniteSliderScrubAnimation() {
    mm.add(
        {
            isDesktop: "(min-width: 991px)",
            isTablet: "(max-width: 990px) and (min-width: 478px)",
            isMobileLandscape:
                "(max-width: 990px) and (orientation: landscape)",
            isMobile: "(max-width: 477px)",
            reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
            let {
                isDesktop,
                isTablet,
                isMobileLandscape,
                isMobile,
                reduceMotion,
            } = context.conditions;

            if (!reduceMotion) {
                const infiniteSliderScrubTl = gsap.timeline({
                    paused: true,
                    scrollTrigger: {
                        trigger: ".section-hero",
                        start: `bottom ${window.innerHeight}`,
                        end: "bottom top",
                        scrub: true,
                        invalidateOnRefresh: true,
                    },
                });

                infiniteSliderScrubTl
                    .to(
                        ".infinite-slider-wrapper",
                        {
                            y: () =>
                                isDesktop || isMobileLandscape
                                    ? "18vw"
                                    : isTablet
                                    ? "72vw"
                                    : "72vw",
                            ease: "none",
                            duration: 1,
                            onStart: () => {
                                if (
                                    !window.matchMedia("(any-pointer: coarse)")
                                        .matches
                                ) {
                                    ScrollTrigger.refresh();
                                }
                            },
                        },
                        0
                    )
                    .to(
                        ".infinite-slider-wrapper",
                        {
                            autoAlpha: 0.1,
                            ease: "none",
                            duration: 0.5,
                            onComplete: () => {
                                if (
                                    !window.matchMedia("(any-pointer: coarse)")
                                        .matches
                                ) {
                                    ScrollTrigger.refresh();
                                }
                            },
                        },
                        isDesktop
                            ? 0.125
                            : isTablet || isMobileLandscape
                            ? 0.125
                            : 0.125
                    );
            }

            return () => {};
        }
    );
}

function setupHeroHome() {
    // Set logo link
    const logo = document.querySelector(".logo");
    setupScrollToLink(logo, "home");

    gsap.set(".section-hero", {
        height: window.innerHeight,
    });

    createSplineCanvases();

    setupSplitTypeFor(".hero-message", "words");

    setupOverlay(".hero-message");

    gsap.set(".section-hero .overlay", {
        backgroundColor: gsap.getProperty(".section-hero", "backgroundColor"),
    });

    setupSplitTypeFor(".section-title");
    setupSplitTypeFor(".section-title-small");
    setupSplitTypeFor(".section-subtitle", "words");
    setupSplitTypeFor(".expertise");

    mm.add("(prefers-reduced-motion: no-preference)", () => {
        setupTextScrollRevealFor(".section-title");
        setupTextScrollRevealFor(".section-title-small");
        setupTextScrollRevealFor(".section-subtitle");
        setupTextScrollRevealFor(".expertise");

        return () => {};
    });

    // Set infinite slider
    const infiniteWrapper = document.querySelector(".infinite-slider-wrapper");
    const infiniteList = document.querySelector(".infinite-slider-list");

    infiniteSlider = new InfiniteSlider(
        infiniteWrapper,
        infiniteList.childNodes
    );

    gsap.set(infiniteWrapper, { pointerEvents: "none" });

    infiniteSlider.items.forEach((item) => {
        item.setupHoverAnimation();
    });

    setupInfiniteSliderScrubAnimation();

    setupSideFullscreen();

    adjustHomePadding();

    ScrollTrigger.create({
        trigger: ".section-hero",
        end: "bottom top",
        onEnter: () => {
            start();
        },
        onLeave: () => {
            stop();
        },
        onEnterBack: () => {
            start();
        },
        onLeaveBack: () => {
            stop();
        },
        // markers: true,
    });
}

function setupCases() {
    mm.add("(min-width: 991px)", () => {
        setupSplitTypeFor(".projects-item-number");
        setupSplitTypeFor(".projects-item-title");
        setupSplitTypeFor(".projects-item-logline");
        setupSplitTypeFor(".projects-item-expertise h3");
        setupSplitTypeFor(".projects-item-link-text");

        setupOverlay(".projects-item-number", true);
        setupOverlay(".projects-item-title", true);
        setupOverlay(".projects-item-logline", true);
        setupOverlay(".projects-item-expertise h3", true);
        setupOverlay(".projects-item-link-text", true);

        document
            .querySelectorAll(".projects-item-info .line")
            .forEach((element) => {
                gsap.set(element, {
                    transformOrigin: "center left",
                });
            });

        gsap.utils
            .toArray(".projects-item-number .content")
            .forEach((number, i) => {
                number.textContent = i < 9 ? "0" + (i + 1) : i + 1;
            });

        createUnderline(".projects-item-link-text .line", {
            color: darkColor,
            small: false,
        });
        gsap.set(".projects-item-link-text .line", {
            display: "inline-block",
            width: "auto",
        });

        return () => {};
    });

    mm.add(
        {
            isNotDesktop: "(max-width: 990px)",
            reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
            let { reduceMotion } = context.conditions;

            setupSplitTypeFor(".projects-item-number");
            setupSplitTypeFor(".projects-item-title");
            setupSplitTypeFor(".projects-item-logline", "words");
            setupSplitTypeFor(".projects-item-expertise h3");
            setupSplitTypeFor(".projects-item-link-text");

            if (!reduceMotion) {
                setupTextScrollRevealFor(".projects-item-number");
                setupTextScrollRevealFor(".projects-item-title");
                setupTextScrollRevealFor(".projects-item-logline");
                setupTextScrollRevealFor(".projects-item-expertise h3");
                setupTextScrollRevealFor(".projects-item-link-text");
            }

            gsap.utils
                .toArray(".projects-item-number .line")
                .forEach((number, i) => {
                    number.textContent = i < 9 ? "0" + (i + 1) : i + 1;
                });

            createUnderline(".projects-item-link-text .line", {
                color: darkColor,
                small: false,
            });
            gsap.set(".projects-item-link-text .line", {
                display: "inline-block",
                width: "auto",
            });

            return () => {};
        }
    );

    // Image and text reveal
    gsap.utils.toArray(".projects-item").forEach((item) => {
        const mediaWrapperWrapper = item.querySelector(
            ".projects-item-media-wrapper"
        );
        const mediaWrapper =
            mediaWrapperWrapper.querySelector(".media-wrapper");
        const info = item.querySelector(".projects-item-info");

        mm.add(
            {
                isDesktop: "(min-width: 991px)",
                isSmaller: "(max-width: 990px)",
                reduceMotion: "(prefers-reduced-motion: reduce)",
            },
            (context) => {
                let { isDesktop, isSmaller, reduceMotion } = context.conditions;

                if (!reduceMotion) {
                    gsap.set(mediaWrapper, {
                        scale: 0.5,
                    });

                    const tlMediaScale = gsap.timeline({
                        paused: true,
                        scrollTrigger: {
                            trigger: mediaWrapperWrapper,
                            start: "top bottom",
                            end: "center center",
                            scrub: 1,
                            // once: isDesktop,
                            // markers: true,
                        },
                    });

                    tlMediaScale.to(mediaWrapper, {
                        scale: 1,
                        ease: "none",
                        onComplete: () => {
                            if (
                                !window.matchMedia("(any-pointer: coarse)")
                                    .matches
                            ) {
                                ScrollTrigger.refresh();
                            }
                        },
                    });

                    if (isDesktop) {
                        gsap.set(item, { pointerEvents: "none" });

                        mediaWrapperWrapper.classList.add("centered");
                        info.classList.add("centered");

                        const tlReveal = gsap.timeline({
                            paused: true,
                            scrollTrigger: {
                                trigger: mediaWrapperWrapper,
                                start: "center center",
                                // once: true,
                                // markers: true,
                                onEnter: () => {
                                    lenis.stop();

                                    gsap.delayedCall(0.5, () => {
                                        lenis.start();

                                        gsap.set(item, {
                                            pointerEvents: "all",
                                        });
                                    });

                                    const state = Flip.getState([
                                        mediaWrapperWrapper,
                                        info,
                                    ]);

                                    mediaWrapperWrapper.classList.remove(
                                        "centered"
                                    );
                                    info.classList.remove("centered");

                                    Flip.from(state, {
                                        duration: 1,
                                        ease: "power2.out",
                                    });
                                },
                                onLeaveBack: () => {
                                    gsap.set(item, { pointerEvents: "none" });

                                    const state = Flip.getState([
                                        mediaWrapperWrapper,
                                        info,
                                    ]);

                                    mediaWrapperWrapper.classList.add(
                                        "centered"
                                    );
                                    info.classList.add("centered");

                                    Flip.from(state, {
                                        duration: 1,
                                        ease: "power2.out",
                                        onStart: () => {
                                            tlReveal.reverse();
                                        },
                                    });
                                },
                            },
                        });

                        animateOverlay(item, tlReveal, 1, 0.5, 0.1);
                    } else {
                        gsap.set(item, { pointerEvents: "all" });

                        mediaWrapperWrapper.classList.remove("centered");
                        info.classList.remove("centered");
                    }
                } else {
                    gsap.set(item, { pointerEvents: "all" });

                    mediaWrapperWrapper.classList.remove("centered");
                    info.classList.remove("centered");
                }

                return () => {};
            }
        );

        const tlHover = gsap
            .timeline({ paused: true })
            .to(mediaWrapperWrapper, {
                padding: "1.5vw",
                duration: 0.5,
                ease: "power2.out",
            })
            .to(
                mediaWrapperWrapper.querySelector(".media"),
                {
                    scale: 1.15,
                    duration: 0.5,
                    ease: "power2.out",
                },
                0
            )
            .addPause();

        const exitTime = tlHover.duration();

        tlHover
            .to(mediaWrapperWrapper, {
                padding: 0,
                duration: 0.5,
                ease: "power2.out",
            })
            .to(
                mediaWrapperWrapper.querySelector(".media"),
                {
                    scale: 1,
                    duration: 0.5,
                    ease: "power2.out",
                },
                0.5
            );

        setupMouseEnterLeaveAnimationFor(
            mediaWrapperWrapper,
            tlHover,
            exitTime
        );
    });
}

function setupSideFullscreen() {
    // Get fullscreen element
    const fullscreen = document.querySelector(".side-fullscreen");
    gsap.set(fullscreen, {
        height: window.innerHeight,
        autoAlpha: 0,
        display: "none",
    });

    // Get fullscreen content elements
    const mediaLinkFullscreen = fullscreen.querySelector(".side-media-link");
    let mediaFullscreen = fullscreen.querySelector(".side-media");

    const captionFullscreen = fullscreen.querySelector(".side-caption");
    const descriptionFullscreen = fullscreen.querySelector(".side-description");

    createUnderline(".side-fullscreen .side-info", {
        color: accentColor,
        small: true,
    });

    createLinkZoomOnParentHover(".side-fullscreen [hover-zoom]");

    // Get counter elements and set total
    const counterCurrentNumber = fullscreen.querySelector(
        ".side-counter-current-number"
    );
    const counterTotalNumber = fullscreen.querySelector(
        ".side-counter span:last-of-type"
    );
    const itemsLength = infiniteSlider.items.length;
    counterTotalNumber.textContent =
        itemsLength < 10 ? "0" + itemsLength : itemsLength;

    // Declare function for changing color on hover
    const setupMouseEnterLeaveColorChangeFor = function (
        element,
        hoverInColor,
        hoverOutColor
    ) {
        const tl = gsap
            .timeline({ paused: true })
            .to(element, {
                color: hoverInColor,
                duration: 0.25,
                ease: "power2.out",
            })
            .addPause();

        const exitTime = tl.duration();

        tl.to(element, {
            color: hoverOutColor,
            duration: 0.25,
            ease: "power2.out",
        });

        setupMouseEnterLeaveAnimationFor(element, tl, exitTime);
    };

    // Get fullscreen div buttons and replace with real buttons
    const prevDiv = fullscreen.querySelector(".side-fullscreen-arrow.prev");
    let prevButton = replaceDivWithButton(prevDiv, "Previous (Left Arrow Key)");
    setupMouseEnterLeaveColorChangeFor(prevButton, accentColor, lightColor);

    const nextDiv = fullscreen.querySelector(".side-fullscreen-arrow.next");
    let nextButton = replaceDivWithButton(nextDiv, "Next (Right Arrow Key)");
    setupMouseEnterLeaveColorChangeFor(nextButton, accentColor, lightColor);

    const closeDiv = fullscreen.querySelector(".side-fullscreen-close");
    const closeButton = replaceDivWithButton(closeDiv, "Close (Esc)");
    setupMouseEnterLeaveColorChangeFor(closeButton, lightColor, accentColor);

    // Declare handler for fullscreen button
    const fullscreenButtonHandler = function (event) {
        switch (event.code) {
            case "ArrowLeft":
                prevButton.click();
                break;
            case "ArrowRight":
                nextButton.click();
                break;
            case "Escape":
                closeButton.click();
                break;
            default:
                break;
        }
    };

    // Add click event to close button
    closeButton.addEventListener("click", () => {
        // Clear event listeners for arrows
        const prevButtonClone = prevButton.cloneNode(true);
        prevButton.replaceWith(prevButtonClone);
        prevButton = prevButtonClone;
        setupMouseEnterLeaveColorChangeFor(prevButton, accentColor, lightColor);

        const nextButtonClone = nextButton.cloneNode(true);
        nextButton.replaceWith(nextButtonClone);
        nextButton = nextButtonClone;
        setupMouseEnterLeaveColorChangeFor(nextButton, accentColor, lightColor);

        // Clear event listener for keydown
        window.removeEventListener("keydown", fullscreenButtonHandler);

        // Lenis start
        lenis.start();

        // Fade in progress bar
        gsap.to(progress, {
            autoAlpha: 1,
            duration: 0.5,
            ease: "power2.out",
        });

        // Fade out fullscreen element
        gsap.to(fullscreen, {
            autoAlpha: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => {
                gsap.set(fullscreen, { display: "none" });
            },
        });

        // Side item has been closed
        if (infiniteSlider) {
            infiniteSlider.isItemOpened = false;
        }
    });

    // Close fullscreen on click outsite of fullscreen content if not touch device
    mm.add("(any-pointer: fine)", (context) => {
        context.add("onWheel", () => {
            if (infiniteSlider.isItemOpened) {
                closeButton.click();
            }
        });
        fullscreen.addEventListener("wheel", context.onWheel, {
            passive: true,
        });

        context.add("onClick", (e) => {
            if (
                e.target.classList.contains("side-fullscreen") ||
                e.target.classList.contains("side-media-wrapper")
            ) {
                if (infiniteSlider.isItemOpened) {
                    closeButton.click();
                }
            }
        });
        fullscreen.addEventListener("click", context.onClick);

        return () => {
            fullscreen.removeEventListener("wheel", context.onWheel);
            fullscreen.removeEventListener("click", context.onClick);

            closeButton.click();
        };
    });

    // Add click event to all side items
    const sideItems = document.querySelectorAll(".infinite-slider-item");
    sideItems.forEach((item, i) => {
        item.addEventListener("click", () => {
            // Lenis stop
            lenis.stop();

            // Replace content
            const videoSource = item.querySelector("source");
            let content;

            if (videoSource.getAttribute("src").length) {
                content = item.querySelector("video").cloneNode(true);
            } else {
                content = item.querySelector("img").cloneNode(true);
            }

            gsap.set(content, { clearProps: "all" });

            mediaFullscreen.parentNode.replaceChild(content, mediaFullscreen);
            mediaFullscreen = content;

            mm.add(
                {
                    isDesktop: "(min-width: 991px)",
                    isTablet: "(max-width: 990px) and (min-width: 478px)",
                    isMobileLandscape:
                        "(max-width: 990px) and (orientation: landscape)",
                    isMobile: "(max-width: 477px)",
                },
                (context) => {
                    let { isDesktop, isTablet, isMobileLandscape, isMobile } =
                        context.conditions;

                    const isTall = item.offsetHeight >= item.offsetWidth;
                    const isFullHeight = isMobileLandscape || isTall;

                    gsap.set(
                        [
                            ".side-media-container",
                            ".side-media-link",
                            ".fullscreen .side-media",
                        ],
                        {
                            height: isFullHeight
                                ? "100%"
                                : isMobileLandscape
                                ? "100%"
                                : "auto",
                            maxHeight:
                                "calc(100vh - 2 * var(--spacing--dynamic-base))",
                        }
                    );

                    return () => {};
                }
            );

            const itemCaption = item.querySelector(".side-caption");
            captionFullscreen.innerHTML = itemCaption.innerHTML;

            captionFullscreen.href = itemCaption.href;
            mediaLinkFullscreen.href = itemCaption.href;

            const itemDescription = item.querySelector(".side-description");
            descriptionFullscreen.innerHTML = itemDescription.innerHTML;
            gsap.utils
                .toArray(descriptionFullscreen.querySelectorAll(".overlay"))
                .forEach((overlay) => {
                    overlay.remove();
                });

            const itemOriginalIndex = i % sideItems.length;
            counterCurrentNumber.innerHTML =
                itemOriginalIndex < 9
                    ? "0" + (itemOriginalIndex + 1)
                    : itemOriginalIndex + 1;

            // Add click event to previous button
            prevButton.addEventListener(
                "click",
                () => {
                    const nextButtonClone = nextButton.cloneNode(true);
                    nextButton.replaceWith(nextButtonClone);
                    nextButton = nextButtonClone;
                    setupMouseEnterLeaveColorChangeFor(
                        nextButton,
                        accentColor,
                        lightColor
                    );

                    const prevIndex =
                        (i - 1 + sideItems.length) % sideItems.length;
                    sideItems[prevIndex].click();
                },
                {
                    once: true,
                }
            );

            // Add click event to next button
            nextButton.addEventListener(
                "click",
                () => {
                    const prevButtonClone = prevButton.cloneNode(true);
                    prevButton.replaceWith(prevButtonClone);
                    prevButton = prevButtonClone;
                    setupMouseEnterLeaveColorChangeFor(
                        prevButton,
                        accentColor,
                        lightColor
                    );

                    const nextIndex = (i + 1) % sideItems.length;
                    sideItems[nextIndex].click();
                },
                {
                    once: true,
                }
            );

            // Fade out progress bar
            gsap.to(progress, {
                autoAlpha: 0,
                duration: 0.5,
                ease: "power2.out",
            });

            // Fade in fullscreen element
            gsap.to(fullscreen, {
                autoAlpha: 1,
                duration: 0.5,
                ease: "power2.out",
                onStart: () => {
                    gsap.set(fullscreen, { display: "grid" });
                },
            });

            window.addEventListener("keydown", fullscreenButtonHandler);

            // Side item has been opened
            infiniteSlider.isItemOpened = true;
        });
    });
}

function setupAbout() {
    // Content
    setupSplitTypeFor(".about-title");

    mm.add("(prefers-reduced-motion: no-preference)", () => {
        setupTextScrollRevealFor(".about-title");
        setupOpacityScrollRevealFor(
            ".about-title-small, .about-body-p, .recognition-item, .socials-container"
        );

        return () => {};
    });

    document.querySelectorAll(".about-title .line").forEach((element) => {
        gsap.set(element, {
            transformOrigin: "center left",
        });
    });

    createImageScrollReveal(".about-body [scroll-reveal]");

    // Image
    const aboutImg = document.querySelector(".section-about .media-wrapper");
    const overlay = createOverlay();
    overlay.classList.add("overlay-about");
    aboutImg.appendChild(overlay);

    gsap.set(overlay, { yPercent: 0, autoAlpha: 1 });

    const aboutImgRevealTl = gsap.timeline({
        paused: true,
        scrollTrigger: {
            trigger: aboutImg,
            start: "center bottom",
        },
    });

    aboutImgRevealTl.to(overlay, {
        autoAlpha: 0,
        duration: 1,
        ease: "power2.out",
        onComplete: () => {
            overlay.remove();
        },
    });

    gsap.set(".section-about .media", { objectPosition: "50% 125%" });

    const aboutImgScrubTl = gsap.timeline({
        paused: true,
        scrollTrigger: {
            trigger: ".section-about .media-wrapper",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
        },
    });

    aboutImgScrubTl.to(".section-about .media", {
        objectPosition: "50% 50%",
        ease: "none",
    });

    // Line Separators
    gsap.utils.toArray(".line-separator").forEach((element) => {
        const tl = gsap.timeline({
            paused: true,
            scrollTrigger: {
                trigger: element,
                start: "top bottom",
                toggleActions: `play none none reset`,
                // markers: true,
            },
        });

        tl.fromTo(
            element,
            {
                width: "0%",
            },
            {
                width: "100%",
                duration: 1.5,
                ease: "power2.out",
            }
        );
    });

    // Links
    createUnderline(".socials-container .social-link", {
        color: accentColor,
        small: true,
    });
}

function setupContact() {
    setupSplitTypeFor(".email-link-text");
    setupSplitTypeFor(".footer-text");
    setupSplitTypeFor(".section-contact .nav-item-text");

    mm.add("(prefers-reduced-motion: no-preference)", () => {
        setupTextScrollRevealFor(".email-link-text");
        setupTextScrollRevealFor(".footer-text");
        setupTextScrollRevealFor(".section-contact .nav-item-text");

        return () => {};
    });

    createUnderline(".email-link-text .line", {
        color: lightColor,
        small: false,
    });

    document.querySelectorAll(".footer-info .line").forEach((element) => {
        gsap.set(element, {
            transformOrigin: "center left",
        });
    });

    const emailRevealTl = gsap.timeline({
        paused: true,
        scrollTrigger: {
            trigger: ".email-link-text",
            start: "top bottom",
            toggleActions: "play none none reset",
            // markers: true,
        },
    });

    emailRevealTl.fromTo(
        ".email-link-text",
        {
            autoAlpha: 0,
        },
        {
            autoAlpha: 1,
            duration: 1.5,
            ease: "power2.out",
        }
    );

    const emailLink = document.querySelector(".email-link");
    const emailLinkText =
        emailLink.querySelector(".email-link-text").textContent;
    const copied = document.querySelector(".copied");
    gsap.set(copied, { autoAlpha: 0, pointerEvents: "none" });

    const tlCopied = gsap.timeline({ paused: true }).fromTo(
        copied,
        { yPercent: 0, autoAlpha: 0 },
        {
            yPercent: 100,
            autoAlpha: 1,
            duration: 0.75,
            ease: "power2.out",
            onComplete: () => {
                gsap.to(copied, {
                    autoAlpha: 0,
                    duration: 0.75,
                    ease: "power2.out",
                });
            },
        }
    );

    emailLink.addEventListener("click", () => {
        navigator.clipboard.writeText(emailLinkText);
        tlCopied.restart();
    });

    const toTopLink = document.querySelector(".footer-to-top-link");
    setupScrollToLink(toTopLink, "home");

    mm.add("(prefers-reduced-motion: no-preference)", () => {
        const footerLinksRevealTl = gsap.timeline({
            paused: true,
            scrollTrigger: {
                trigger: ".footer",
                start: "top bottom",
                toggleActions: "play none none reset",
                // markers: true,
            },
        });

        footerLinksRevealTl.fromTo(
            ".footer a",
            {
                yPercent: 100,
                autoAlpha: 0,
            },
            {
                yPercent: 0,
                autoAlpha: 1,
                duration: 1.5,
                stagger: { amount: 0.2 },
                ease: "power2.out",
            }
        );

        return () => {};
    });
}

function clearUrl() {
    gsap.delayedCall(0.005, () => {
        history.replaceState(
            "",
            document.title,
            window.location.origin +
                window.location.pathname +
                window.location.search
        );
    });
}

function linkEventHandler(e) {
    e.preventDefault();

    const isLinkMobile = this.classList.contains("mobile-nav-item");

    if (isLinkMobile) {
        e.stopImmediatePropagation();

        const id = this.getAttribute("href").slice(1);
        const section = document.getElementById(id);

        lenis.scrollTo(section, { duration: 0.1, force: true });

        const closeMenuButton = document.querySelector(".nav-item-close");

        closeMenuButton.click();
    } else {
        lenis.stop();

        let scrollTimeout;
        addEventListener(
            "scroll",
            function checkScrollEnd() {
                clearTimeout(scrollTimeout);

                scrollTimeout = setTimeout(function () {
                    lenis.start();

                    removeEventListener("scroll", checkScrollEnd);
                }, 150);
            },
            { passive: true }
        );

        gsap.delayedCall(2, () => {
            if (lenis.isStopped) {
                lenis.start();
            }
        });
    }

    clearUrl();
}

function setupScrollToLink(link, sectionId) {
    link.href = "#" + sectionId;

    link.addEventListener("click", linkEventHandler);
}

function setupLink(link, sectionId) {
    link.href = window.location.origin + "/#" + sectionId;

    link.removeEventListener("click", linkEventHandler);
}

function setupNavLinks() {
    gsap.utils.toArray(".nav-item").forEach((link) => {
        let sectionId = link.textContent.toLowerCase();

        if (currentPage === namespaces.HOME) {
            setupScrollToLink(link, sectionId);

            if (link.classList.contains("w--current")) {
                link.classList.remove("w--current");
            }

            if (
                sectionId === "home" &&
                !link.classList.contains("w--current")
            ) {
                link.classList.add("w--current");
            }
        } else {
            setupLink(link, sectionId);

            if (link.classList.contains("w--current")) {
                link.classList.remove("w--current");
            }

            if (
                currentPage === namespaces.PROJECT &&
                sectionId === "cases" &&
                !link.classList.contains("w--current")
            ) {
                link.classList.add("w--current");
            }
        }
    });
}

function createSplineCanvases() {
    document.querySelectorAll(".element-3d").forEach((canvasWrapper) => {
        const canvas = document.createElement("canvas");
        canvasWrapper.appendChild(canvas);
        canvas.dataset.scene = canvasWrapper.dataset.scene;
        canvasWrapper.removeAttribute("data-scene");
    });
}

async function setupSplineCanvases(container) {
    const promises = [];

    container.querySelectorAll(".element-3d canvas").forEach((canvas) => {
        const spline = new Application(canvas);

        currentSplineApps.push(spline);

        promises.push(
            spline.load(canvas.dataset.scene).catch((e) => {
                console.error("Spline error: ", e);
            })
        );

        canvas.removeAttribute("data-scene");
    });

    await Promise.all(promises).then(() => {
        setupNavLinks();

        gsap.delayedCall(0.1, () => {
            document.querySelectorAll(".element-3d").forEach((project3d, i) => {
                currentSplineApps[i].stop();

                ScrollTrigger.create({
                    trigger: project3d,
                    start: "top bottom",
                    end: "bottom top",
                    onEnter: () => {
                        currentSplineApps[i].play();
                    },
                    onLeave: () => {
                        currentSplineApps[i].stop();
                    },
                    onEnterBack: () => {
                        currentSplineApps[i].play();
                    },
                    onLeaveBack: () => {
                        currentSplineApps[i].stop();
                    },
                    // markers: true,
                });
            });
        });

        if (!preloaderLoaded) {
            preloaderLoaded = true;

            // console.log("preloader completed");

            checkLoadingCompletion();
        }
    });
}

function disposeSplineCanvases() {
    currentSplineApps.forEach((spline) => {
        spline.stop();
        spline.dispose();
    });

    currentSplineApps = [];
}

function setupHeroProject() {
    // Set logo link
    const logo = document.querySelector(".logo");
    setupLink(logo, "home");

    setupSplitTypeFor(".project-title");
    setupSplitTypeFor(".project-overview", "words");

    setupOverlay(".project-title");
    setupOverlay(".project-overview");

    gsap.set(".cover.project .overlay", {
        backgroundColor: gsap.getProperty(".cover.project", "backgroundColor"),
    });
}

function setupContent() {
    ScrollTrigger.create({
        trigger: ".section-project-intro-media",
        start: "top 5%",
        end: "bottom top",
        // markers: true,
        onEnter: () => {
            logoColorTl.play();
        },
        onLeave: () => {
            logoColorTl.reverse();
        },
        onEnterBack: () => {
            logoColorTl.play();
        },
        onLeaveBack: () => {
            logoColorTl.reverse();
        },
    });

    if (document.querySelector(".circle-link")) {
        gsap.set(".circle-link", {
            width: "100%",
            height: "fit-content",
            borderRadius: "var(--spacing--dynamic-s)",
            padding: "var(--spacing--dynamic-base)",
            bottom: 0,
            right: 0,
            position: "relative",
            rotate: 0,
        });
        gsap.set(".circle-link h3", { fontSize: "2.5rem" });

        const circleLink = document.querySelector(".circle-link");
        const circleLinkParent = circleLink.parentNode;
        const circleLinkHeading = circleLink.querySelector("h3");

        if (circleLinkParent && circleLinkParent.firstChild !== circleLink) {
            circleLinkParent.insertBefore(
                circleLink,
                circleLinkParent.firstChild
            );
        }

        if (circleLinkHeading) {
            circleLinkHeading.textContent = "See full research";
        }

        createUnderline(".circle-link h3", { color: darkColor, small: false });
    }

    createSplineCanvases();

    setupSplitTypeFor(".project-info-title");
    setupSplitTypeFor(".project-expertise h3");
    setupSplitTypeFor(".project-period");

    // gsap.set(".project-expertise h3 .line", {
    //     paddingBottom: "0.125em",
    // });

    setupSplitTypeFor(".project-next-section-title");
    setupSplitTypeFor(".project-next-title");

    mm.add("(prefers-reduced-motion: no-preference)", () => {
        setupTextScrollRevealFor(".project-info-title");
        setupTextScrollRevealFor(".project-expertise h3");
        setupTextScrollRevealFor(".project-period");

        setupOpacityScrollRevealFor(".project-content-title");
        setupOpacityScrollRevealFor(".project-content-body-p");

        setupTextScrollRevealFor(".project-next-section-title");
        setupTextScrollRevealFor(".project-next-title");

        setupMediaScrollRevealFor(".w-embed > .project-content-media");

        return () => {};
    });

    mm.add(
        {
            isDesktop: "(min-width: 991px)",
            isTablet: "(max-width: 990px) and (min-width: 478px)",
            isMobileLandscape:
                "(max-width: 990px) and (orientation: landscape)",
            isMobile: "(max-width: 477px)",
            reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
            let {
                isDesktop,
                isTablet,
                isMobileLandscape,
                isMobile,
                reduceMotion,
            } = context.conditions;

            if (!reduceMotion) {
                if (isDesktop) {
                    setupMediaScrollRevealFor(
                        ".w-embed > .project-content-media-container"
                    );
                } else {
                    setupMediaScrollRevealFor(
                        ".w-embed > .project-content-media-container.has-background"
                    );

                    setupMediaScrollRevealFor(
                        ".w-embed > .project-content-media-container:not(.has-background) > .project-content-media"
                    );

                    setupMediaScrollRevealFor(
                        ".w-embed > .project-content-media-container > .project-content-media-container"
                    );
                }
            }

            return () => {};
        }
    );
}

function setup404() {
    const logo = document.querySelector(".logo");
    setupLink(logo, "home");

    gsap.set(".logo-text", { color: "var(--color--light)" });

    createSplineCanvases();

    createUnderline("a.section-404-text", {
        color: lightColor,
        small: true,
    });
}

function animateOverlay(
    element,
    timeline,
    duration = 1,
    delay = 0,
    stagger = 0
) {
    gsap.utils.toArray(element).forEach((item) => {
        gsap.utils
            .toArray(item.querySelectorAll(".line, .word"))
            .forEach((type, i) => {
                const overlay = type.querySelector(".overlay");
                const content = type.querySelector(".content");

                if (overlay) {
                    if (overlay.classList.contains("overlay-x")) {
                        timeline.fromTo(
                            overlay,
                            { xPercent: 0 },
                            {
                                xPercent: 105,
                                duration: duration,
                                ease: "power2.out",
                            },
                            delay + i * stagger
                        );
                    } else {
                        timeline
                            .fromTo(
                                overlay,
                                { yPercent: 0 },
                                {
                                    yPercent: -105,
                                    duration: duration,
                                    ease: "power2.out",
                                },
                                delay + i * stagger
                            )
                            .set(overlay, { autoAlpha: 0 });
                    }
                }

                if (content) {
                    timeline.to(
                        content,
                        {
                            scale: 1,
                            duration: duration,
                            ease: "power2.out",
                        },
                        delay + i * stagger
                    );
                }
            });
    });
}

function getTransitionAppearTl() {
    gsap.set(".preloader", {
        display: "flex",
        yPercent: 0,
        // scale: 0,
        autoAlpha: 0,
    });

    gsap.set(".wipe-main", { yPercent: 0 });
    gsap.set(".wipe-accent", { yPercent: 0 });

    const tl = gsap
        .timeline({
            // paused: true,
            onStart: () => {
                lenis.stop();

                gsap.set(".loading", { autoAlpha: 0 });
                preloaderLoadingTl.progress(0).play();

                gsap.set(".preloader", { cursor: "progress" });
            },
        })
        .to(".preloader", {
            yPercent: 0,
            scale: 1,
            autoAlpha: 1,
            duration: 1,
            ease: "power2.inOut",
        });

    return tl;
}

function getTransitionLeaveTl() {
    gsap.set(".logo-text .overlay", {
        backgroundColor: gsap.getProperty(
            ".section:first-of-type",
            "backgroundColor"
        ),
    });

    gsap.set(".nav-wrapper > .overlay", {
        backgroundColor: gsap.getProperty(
            ".section:first-of-type",
            "backgroundColor"
        ),
    });

    const locationHash = location.hash.slice(1);
    let section = null;

    if (locationHash.length > 0) {
        section = document.getElementById(locationHash);
        clearUrl();
    }

    if (section) {
        if (locationHash === "about") {
            gsap.set("navbar .overlay", { backgroundColor: "none" });
        }

        lenis.scrollTo(section, { duration: 0.1, force: true });
    } else {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant",
        });
        lenis.scrollTo("top", { duration: 0.1, force: true });

        // console.log("scrolled to top");
    }

    const transitionLeaveTl = gsap
        .timeline({
            paused: true,
            delay: 1.25,
            onStart: () => {
                preloaderLoadingTl.pause();
            },
            onComplete: () => {
                gsap.set(".preloader", { display: "none", cursor: "auto" });

                ScrollTrigger.refresh();

                lenis.start();
            },
        })
        .to(".wipe-main", {
            yPercent: -105,
            duration: 1.5,
            ease: "power4.out",
        })
        .to(
            ".wipe-accent",
            {
                yPercent: -105,
                duration: 1.5,
                ease: "power4.out",
            },
            0.1
        )
        .to(
            ".loading",
            {
                autoAlpha: 0,
                duration: 1,
                ease: "power4.out",
            },
            0
        );

    const delay = transitionLeaveTl.duration() / 4;

    animateNavbar(transitionLeaveTl, delay);

    if (currentPage === namespaces.HOME) {
        animateHeroHome(transitionLeaveTl, delay);
    } else {
        animateHeroProject(transitionLeaveTl, delay);
    }

    return transitionLeaveTl;
}

function animateNavbar(tl, delay) {
    animateOverlay(".logo-text", tl, 1, delay + 0.25, 0);

    tl.fromTo(
        ".nav-wrapper > .overlay",
        { yPercent: 0 },
        {
            yPercent: -105,
            duration: 1,
            ease: "power2.out",
        },
        delay + 0.25
    );

    animateOverlay(".nav-items .nav-item-text", tl, 1, delay + 0.25, 0);
}

function animateHeroHome(tl, delay) {
    const sideItems = document.querySelectorAll(".infinite-slider-item");

    sideItems.forEach((item, i) => {
        gsap.set(item, { willChange: "transform" });

        mm.add("(prefers-reduced-motion: no-preference)", () => {
            const sideMediaWrapper = item.querySelector(".side-media-wrapper");

            gsap.set(sideMediaWrapper, {
                y: () =>
                    i % 2 === 0
                        ? `-=${
                              window.innerWidth > window.innerHeight
                                  ? vw(72)
                                  : window.innerHeight / 2
                          }`
                        : `-=${
                              window.innerWidth > window.innerHeight
                                  ? vw(36)
                                  : window.innerHeight / 4
                          }`,
                rotationZ:
                    i % 2 === 0
                        ? Math.floor(Math.random() * 31)
                        : Math.floor(Math.random() * -31),
                perspective: 1000,
                autoAlpha: 0,
            });

            const sideMediaMask = item.querySelector(".side-media-mask");

            const randomZDesktop =
                Math.floor(Math.random() * (-500 - -1000 + 1)) + -1000;
            const randomZSmallerDesktop =
                Math.floor(Math.random() * (-1500 - -3000 + 1)) + -3000;

            const randomZ =
                Math.floor(Math.random() * (-250 - -500 + 1)) + -500;
            const randomZSmaller =
                Math.floor(Math.random() * (-750 - -1500 + 1)) + -1500;

            gsap.set(sideMediaMask, {
                z: () =>
                    i % 2 === 0
                        ? window.innerWidth > window.innerHeight
                            ? randomZDesktop
                            : randomZ
                        : window.innerWidth > window.innerHeight
                        ? randomZSmallerDesktop
                        : randomZSmaller,
            });

            tl.to(
                sideMediaWrapper,
                {
                    x: 0,
                    y: 0,
                    rotationZ: 0,
                    autoAlpha: 1,
                    duration: 2.5,
                    ease: "power2.out",
                },
                delay + 0.25
            ).to(
                sideMediaMask,
                { z: 0, duration: 2.5, ease: "power2.out" },
                delay + 0.25
            );

            tl.set(
                infiniteSlider,
                {
                    isScrubTlCompleted: true,
                },
                tl.duration() - 1.5
            ).set(
                infiniteSlider.wrapperElement,
                {
                    pointerEvents: "all",
                },
                tl.duration()
            );

            return () => {};
        });

        mm.add("(prefers-reduced-motion: reduce)", () => {
            infiniteSlider.isScrubTlCompleted = true;

            return () => {};
        });
    });

    animateOverlay(".hero-message", tl, 1, delay, 0);
}

function animateHeroProject(tl, delay) {
    animateOverlay(".project-title", tl, 1, delay, 0);
    animateOverlay(".project-info-title", tl, 1, delay + 0.25, 0);
    animateOverlay(".project-overview", tl, 1, delay + 0.5, 0);
    animateOverlay(".project-expertise h3", tl, 1, delay + 0.5, 0);
    animateOverlay(".project-period", tl, 1, delay + 0.5, 0);
}

function checkLoadingCompletion() {
    if (preloaderLoaded && pageLoaded) {
        const tl = getTransitionLeaveTl();

        tl.to(
            ".preloader-title",
            {
                autoAlpha: 0,
                duration: 1,
                ease: "power4.out",
            },
            0
        )
            .to(
                ".preloader-title",
                {
                    y: "24vw",
                    duration: 1,
                    ease: "power4.out",
                },
                0
            )
            .to(
                ".preloader-subtitle",
                {
                    autoAlpha: 0,
                    duration: 1,
                    ease: "power4.out",
                },
                0
            )
            .to(
                ".preloader-subtitle",
                {
                    y: "24vw",
                    duration: 1,
                    ease: "power4.out",
                },
                0
            )
            .to(
                ".loading",
                {
                    autoAlpha: 0,
                    duration: 1,
                    ease: "power4.out",
                },
                0
            );

        tl.play();
    }
}

function cleanGSAP() {
    // console.log("cleanGSAP");

    ScrollTrigger.getAll().forEach((t) => t.kill());
    window.dispatchEvent(new Event("resize"));

    mm.revert();
}

function onResize() {
    if (windowWidth !== window.innerWidth) {
        windowWidth = window.innerWidth;

        const entries = Object.entries(splitTypeObj);

        if (entries.length > 0) {
            for (const [key, value] of entries) {
                if (key === ".about-title") {
                    value.revert();
                }
            }

            setupSplitTypeFor(".about-title");
            setupTextScrollRevealFor(".about-title");
        }

        adjustNavbarRelatedLayout();

        if (currentPage === namespaces.HOME) {
            if (infiniteSlider) {
                infiniteSlider.onResize();
            }

            gsap.set(".section-hero", {
                height: window.innerHeight,
            });

            adjustHomePadding();
        }
    }

    if (currentPage === namespaces.HOME) {
        gsap.set(".side-fullscreen", {
            height: window.innerHeight,
        });
    } else if (currentPage === namespaces.NOT_FOUND) {
        gsap.set(".section-404", {
            height: window.innerHeight,
        });
    }

    gsap.set(".mobile-menu", {
        height: window.innerHeight,
    });

    gsap.set(".preloader", {
        height: window.innerHeight,
    });
}

function addEventListeners() {
    window.addEventListener("resize", onResize);
}

function render() {
    if (!isRunning) return;

    if (infiniteSlider) {
        infiniteSlider.update();
    }

    if (history.scrollRestoration === "auto") {
        history.scrollRestoration = "manual";
    }

    requestAnimationFrame(render);
}

function start() {
    isRunning = true;
    render();
}

function stop() {
    isRunning = false;
}

function resetWebflow(data) {
    const { Webflow } = window;

    if (
        !Webflow ||
        !("destroy" in Webflow) ||
        !("ready" in Webflow) ||
        !("require" in Webflow)
    )
        return;

    let parser = new DOMParser();
    let dom = parser.parseFromString(data.next.html, "text/html");
    let webflowPageId = $(dom).find("html").attr("data-wf-page");

    $("html").attr("data-wf-page", webflowPageId);

    // Reset Webflow Core
    Webflow.destroy();
    Webflow.ready();

    // Reinitialize Interactions
    const ix2 = Webflow.require("ix2");
    if (ix2) {
        ix2.init();
    }

    // Reinitialize Sliders
    const slider = Webflow.require("slider");
    if (slider) {
        slider.redraw();
        slider.ready();
    }

    // Reinitialize Tabs
    const tabs = Webflow.require("tabs");
    if (tabs) {
        tabs.redraw();
    }

    // Reinitialize Lightboxes
    const lightbox = Webflow.require("lightbox");
    if (lightbox) {
        lightbox.ready();
    }
}

function removeBadge() {
    const badge = document.querySelector(".w-webflow-badge");
    // console.log(badge);
    if (badge) badge.remove();
}
