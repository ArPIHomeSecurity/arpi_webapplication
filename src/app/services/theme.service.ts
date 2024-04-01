import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {

    private renderer: Renderer2;
    private theme: string;

    constructor(rendererFactory: RendererFactory2) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    _detectPrefersTheme() {
        // Detect if prefers-color-scheme is supported
        if (window.matchMedia('(prefers-color-scheme)').media !== 'not all') {
            this.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'argus-dark-theme' : 'argus-light-theme';
        } else {
            this.theme = 'argus-light-theme';
        }
    }

    _saveTheme(theme: string) {
        this.theme = theme;
        localStorage.setItem('prefers-color', theme);
    }

    _getTheme() {
        const localStorageTheme = localStorage.getItem('prefers-color');
        if (localStorageTheme) {
            this.theme = localStorageTheme;
        } else {
            this._detectPrefersTheme();
        }
    }

    load(): boolean {
        this._getTheme();
        this.renderer.addClass(document.body, this.theme);
        return this.theme === 'argus-dark-theme';
    }

    updateTheme(theme: string) {
        this._saveTheme(theme);
        this.renderer.addClass(document.body, this.theme);
        this.renderer.removeClass(document.body, this.theme === 'argus-dark-theme' ? 'argus-light-theme' : 'argus-dark-theme');
    }

    updateSize(isSmallScreen: boolean) {
        if (isSmallScreen) {
            this.renderer.addClass(document.body, 'small-screen');
            this.renderer.removeClass(document.body, 'large-screen');
        } else {
            this.renderer.addClass(document.body, 'large-screen');
            this.renderer.removeClass(document.body, 'small-screen');
        }
    }

    currentActive() {
        return this.theme;
    }
}
