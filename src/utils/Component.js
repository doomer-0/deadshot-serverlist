class Component {
    constructor(tag = 'div', className = '') {
        this.element = document.createElement(tag);
        if (className) {
            this.element.className = `ui-component ${className}`;
        }
    }

    mount(parent) {
        if (typeof parent === 'string') {
            document.querySelector(parent).appendChild(this.element);
        } else if (parent instanceof Component) {
            parent.element.appendChild(this.element);
        } else if (parent instanceof HTMLElement) {
            parent.appendChild(this.element);
        }
    }

    show() {
        this.element.style.display = '';
    }

    hide() {
        this.element.style.display = 'none';
    }


}
