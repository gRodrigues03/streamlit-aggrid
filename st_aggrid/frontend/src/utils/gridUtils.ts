type CSSDict = { [key: string]: { [key: string]: string } }

export function getCSS(styles: CSSDict): string {
  const css = []
  for (let selector in styles) {
    let style = selector + " {"
    for (let prop in styles[selector]) {
      style += prop + ": " + styles[selector][prop] + ";"
    }
    style += "}"
    css.push(style)
  }
  return css.join("\n")
}

export function addCustomCSS(custom_css: CSSDict): void {
  const css = getCSS(custom_css);
  const style = document.createElement("style");
  style.textContent = css
  document.head.appendChild(style)
}

export function parseJsCodeFromPython(v: string) {
  const JS_PLACEHOLDER = "::JSCODE::"
  const funcReg = new RegExp(`${JS_PLACEHOLDER}(.*?)${JS_PLACEHOLDER}`, "s")
  let match = funcReg.exec(v)
  if (match) {
    const funcStr = match[1]
    // eslint-disable-next-line
    return new Function("return " + funcStr)()
  } else {
    return v
  }
}
