"""扩展小白 E2E：移动端、首启向导、演示收束、导出入口"""
import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:5173"
OUT = Path(__file__).parent / "e2e-newbie-report-extended.json"


def issue(report, sev, area, msg, detail=""):
    report["issues"].append({"severity": sev, "area": area, "issue": msg, "detail": detail})


def run_flow(page, report, label, viewport=None):
    ctx_note = f"viewport={viewport}" if viewport else "desktop"
    report["flows"].append({"name": label, "context": ctx_note})

    if viewport:
        page.set_viewport_size(viewport)

    page.goto(BASE, wait_until="networkidle")
    page.evaluate("""() => {
      localStorage.removeItem('roundtable:onboardingDone');
      localStorage.removeItem('roundtable:onboardingStep');
      localStorage.setItem('roundtable:leftPanelOpen', 'false');
      localStorage.setItem('roundtable:rightPanelOpen', 'false');
    }""")
    page.reload(wait_until="networkidle")

    # 进工作台
    for pat in [r"进入议事厅", r"进入工作台", r"开始"]:
        b = page.get_by_role("button", name=re.compile(pat, re.I))
        if b.count():
            b.first.click()
            break
    page.wait_for_timeout(800)

    # 首启向导
    wiz = page.locator(".onboarding-wizard")
    draft = page.locator(".delib-draft")
    if wiz.count() and wiz.is_visible() and draft.count() and draft.is_visible():
        issue(report, "P1", "首启", f"[{label}] 首启向导与 WorkbenchDraft 同时可见", "应互斥")

    # 跳过向导
    skip = page.get_by_role("button", name=re.compile(r"跳过", re.I))
    if skip.count():
        skip.first.click()
        page.wait_for_timeout(500)

    # 顶栏启动
    top_primary = page.locator(".top-actions button.btn-primary").filter(
        has_text=re.compile(r"启动|演示", re.I)
    )
    if top_primary.count() == 0 or not top_primary.first.is_visible():
        issue(report, "P1", "工作台", f"[{label}] 顶栏无可见的主色「启动」按钮")

    draft_cta = page.locator(".delib-draft-cta")
    if draft_cta.count() == 0 or not draft_cta.first.is_visible():
        issue(report, "P1", "工作台", f"[{label}] 主区无「启动审议」大按钮")

    # 演示
    demo = page.locator(".delib-draft-card").filter(has_text="先看演示")
    if demo.count() == 0:
        demo = page.locator(".workbench-mobile-bar button").filter(has_text="演示")
    if demo.count():
        demo.first.click(force=True)
        page.wait_for_selector(".outcome-panel, .delib-closure", timeout=15000)
        page.wait_for_timeout(800)
        text = page.locator("body").inner_text()
        if "审议结果一览" not in text and "决策纪要" not in text:
            issue(report, "P2", "回放", f"[{label}] 演示后未出现「审议结果」", "instant demo 可能失败")
        if "Decision Packet" in text:
            issue(report, "P2", "文案", f"[{label}] 界面仍出现 Decision Packet 英文")
        if re.search(r"tension-[a-z0-9]", text, re.I):
            issue(report, "P0", "文案", f"[{label}] 演示正文含 tension- 内部 id")

    # 导出入口
    export_btn = page.get_by_role("button", name=re.compile(r"导出|Markdown|HTML", re.I))
    if export_btn.count() == 0:
        issue(report, "P2", "导出", f"[{label}] 未找到导出按钮（可能在情报侧栏）")

    # 移动端顶栏文字按钮
    if viewport and viewport["width"] < 500:
        if page.locator(".top-labeled-btn").count() and not page.locator(".top-labeled-btn").first.is_visible():
            issue(report, "P2", "移动端", "「项目/情报/专注」文字按钮在窄屏隐藏", "仅汉堡菜单，侧栏难发现")

    page.screenshot(path=str(Path(__file__).parent / f"e2e-ext-{label}.png"), full_page=True)


def main():
    report = {"issues": [], "flows": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_context(locale="zh-CN").new_page()
        run_flow(page, report, "desktop", {"width": 1440, "height": 900})
        run_flow(page, report, "mobile", {"width": 390, "height": 844})
        browser.close()

    # 静态 DEMO 文案扫描
    demo_src = Path(__file__).parent.parent / "shared" / "personas.js"
    src = demo_src.read_text(encoding="utf-8")
    if re.search(r"判断函数", src) and re.search(r"text:\s*'[^']*判断函数", src):
        issue(report, "P2", "演示数据", "演示发言含「判断函数」术语", "shared/personas.js DEMO_MEETING")
    if "Decision Packet" in src:
        issue(report, "P2", "演示数据", "演示 workspace 含 Decision Packet 英文问句")

    # 汇总
    for sev in ("P0", "P1", "P2", "P3"):
        report.setdefault("counts", {})[sev] = sum(1 for i in report["issues"] if i["severity"] == sev)
    report["counts"]["total"] = len(report["issues"])
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report["counts"], ensure_ascii=False))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()