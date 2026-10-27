// The app's DOM surface, built from the actual HTML without a browser dependency.
export function createDocument(html) {
  let document

  class TestNode {
    constructor(tagName, attributes = {}) {
      this.tagName = tagName
      this.attributes = { ...attributes }
      this.children = []
      this.dataset = {}
      this.listeners = new Map()
      this.hidden = 'hidden' in attributes
      this.checked = 'checked' in attributes
      this.value = attributes.value ?? ''
      this.content = ''
    }

    set textContent(value) {
      this.content = String(value)
      this.children = []
    }

    get textContent() {
      return this.content + this.children.map((child) => child.textContent).join('')
    }

    append(...children) {
      this.children.push(...children)
    }

    replaceChildren(...children) {
      this.content = ''
      this.children = [...children]
    }

    setAttribute(name, value) {
      this.attributes[name] = String(value)
    }

    removeAttribute(name) {
      delete this.attributes[name]
    }

    matches(selector) {
      const tag = selector.match(/^[a-z]+/)?.[0]
      if (tag && tag !== this.tagName) return false
      return [...selector.matchAll(/\[([\w-]+)="([^"]*)"\]/g)]
        .every(([, name, value]) => this.attributes[name] === value)
    }

    querySelectorAll(selector) {
      return this.children.flatMap((child) => [
        ...(child.matches(selector) ? [child] : []),
        ...child.querySelectorAll(selector),
      ])
    }

    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, [])
      this.listeners.get(type).push(listener)
    }

    async dispatch(type, target = this) {
      for (const listener of this.listeners.get(type) ?? []) {
        await listener({ target, preventDefault() {} })
      }
    }

    focus() {
      document.activeElement = this
    }

    reset() {
      for (const node of nodes.filter((node) => node.tagName === 'input')) {
        node.value = node.attributes.value ?? ''
        node.checked = 'checked' in node.attributes
      }
    }
  }

  const nodes = [...html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)].map(([, tag, source]) => {
    const attributes = Object.fromEntries(
      [...source.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(([, name, value]) => [name, value ?? '']),
    )
    return new TestNode(tag.toLowerCase(), attributes)
  })

  document = {
    title: '',
    getElementById: (id) => nodes.find((node) => node.attributes.id === id) ?? null,
    querySelector: (selector) => nodes.find((node) => node.matches(selector)) ?? null,
    createElement: (tag) => new TestNode(tag),
    createTextNode: (text) => {
      const node = new TestNode('#text')
      node.textContent = text
      return node
    },
  }
  return { document, Node: TestNode }
}
