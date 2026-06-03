"""
小白视角全量 E2E 审计：从落地页 → 工作台 → 演示审议 → 回放
输出 JSON 报告到 tests/e2e-newbie-report.json
"""
import json
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:5173"
REPORT_PATH = Path(__file__).parent / "e2e-newbie-report.json"

INTERNAL_ID_RE = re.compile(
    r"\b(tension|question|evidence|option)-[a-z0-9_-]+\b|"
    r"\b(openQuestions|workspace|evidencePool)\b",
    re.I,
)


def add(report, severity, area, issue, detail=""):
    report["issues"].append({
        "severity": severity,  # P0|P1|P2|P3
        "area": area,
        "issue": issue,
        "detail": detail,
    })


def add_step(report, name, ok, note=""):
    report["steps"].append({"name": name, "ok": ok, "note": note})


def main():
    report = {
        "baseUrl": BASE,
        "steps": [],
        "issues": [],
        "consoleErrors": [],
        "pageErrors": [],
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(locale="zh-CN", viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.on("console", lambda msg: (
            report["consoleErrors"].append({"type": msg.type, "text": msg.text})
            if msg.type in ("error", "warning")
            else None
        ))
        page.on("pageerror", lambda err: report["pageErrors"].append(str(err)))

        # ── 1. 落地页 ──
        try:
            page.goto(BASE, wait_until="networkidle", timeout=30000)
            page.evaluate("""() => {
              localStorage.setItem('roundtable:onboardingDone', 'true');
            }""")
            page.reload(wait_until="networkidle")
            add_step(report, "打开首页", True)
        except Exception as e:
            add_step(report, "打开首页", False, str(e))
            add(report, "P0", "启动", "无法访问本地服务", str(e))
            _write(report)
            return 1

        body_text = page.locator("body").inner_text(timeout=5000)
        if "圆桌" not in body_text and "Roundtable" not in body_text:
            add(report, "P1", "落地页", "首页缺少品牌/产品名", body_text[:200])

        enter_btns = page.get_by_role("button", name=re.compile(r"进入|开始|工作台|议事", re.I))
        if enter_btns.count() == 0:
            add(report, "P0", "落地页", "找不到进入工作台的按钮")
        else:
            add_step(report, "落地页有入口按钮", True, f"count={enter_btns.count()}")

        page.screenshot(path=str(Path(__file__).parent / "e2e-01-landing.png"), full_page=True)

        # ── 2. 进入工作台 ──
        entered = False
        for label in ["进入议事厅", "进入工作台", "开始审议", "Start"]:
            btn = page.get_by_role("button", name=re.compile(label, re.I))
            if btn.count() > 0:
                btn.first.click()
                entered = True
                break
        if not entered:
            page.goto(f"{BASE}/?view=workspace", wait_until="networkidle")
            entered = True

        page.wait_for_timeout(1500)
        add_step(report, "进入工作台", entered)

        page.screenshot(path=str(Path(__file__).parent / "e2e-02-workbench.png"), full_page=True)

        wb_text = page.locator("body").inner_text()
        if "写下一个值得开会" not in wb_text:
            add(report, "P1", "工作台空态", "空态主标题不可见")

        skip = page.get_by_role("button", name=re.compile(r"跳过", re.I))
        if skip.count():
            skip.first.click()
            page.wait_for_timeout(400)

        topic = page.locator("#delib-draft-topic").first
        if topic.count() == 0:
            add(report, "P0", "工作台", "找不到议题输入框")
        else:
            topic.fill("作为应届生，我该如何准备秋招面试？需要哪些证据才能做决策？")
            add_step(report, "填写议题", True)

        start_btn = page.get_by_role("button", name=re.compile(r"启动|演示|审议", re.I))
        if start_btn.count() == 0:
            add(report, "P0", "工作台", "找不到启动/演示按钮")
        else:
            visible_starts = [start_btn.nth(i).inner_text() for i in range(min(start_btn.count(), 5))]
            add_step(report, "启动按钮存在", True, str(visible_starts))

        preflight = page.locator(".topic-preflight")
        if topic.count() and preflight.count() == 0:
            add(report, "P2", "工作台", "填写议题后未显示「发起前确认」清单")

        # 侧栏「启动」是否可见（侧栏收起时小白找不到）
        sidebar_cta = page.locator(".sidebar-primary-cta")
        if sidebar_cta.count() and not sidebar_cta.is_visible():
            add(report, "P2", "工作台", "侧栏底部「启动审议」在侧栏收起时不可见（依赖顶栏/主区按钮）")

        top_start = page.locator(".top-actions button.btn-primary").filter(
            has_text=re.compile(r"启动|演示", re.I)
        )
        if top_start.count() == 0 or not top_start.first.is_visible():
            add(report, "P1", "工作台", "顶栏主按钮「启动审议」不可见")

        # ── 3. 演示审议 ──
        demo = page.locator(".delib-draft-card").filter(has_text="先看演示")
        if demo.count() > 0:
            demo.first.click(force=True)
            try:
                page.wait_for_selector(".outcome-panel, .delib-minute", timeout=15000)
                add_step(report, "演示审议进入发言/回放", True)
            except Exception:
                add_step(report, "演示审议进入发言/回放", False, "25s 内未见发言区")
                add(report, "P1", "演示", "点击演示后长时间无发言内容")

            page.wait_for_timeout(2000)
            page.screenshot(path=str(Path(__file__).parent / "e2e-03-demo-playback.png"), full_page=True)

            playback_text = page.locator("body").inner_text()
            for m in INTERNAL_ID_RE.finditer(playback_text):
                add(report, "P0", "发言文案", f"仍含内部编号/字段名: {m.group()}", "演示或回放正文")

            if "Session Workspace" in playback_text:
                add(report, "P2", "界面文案", "仍出现英文 Session Workspace")

            if "FRAME" in playback_text and "开场定调" not in playback_text:
                add(report, "P3", "界面文案", "阶段仍显示英文 FRAME 等")

            # 专注/侧栏
            if page.locator(".panel-rail--left").count() and page.locator('[data-sidebar="collapsed"]').count():
                add_step(report, "侧栏收起时有边缘展开条", True)

            outcome = page.locator(".outcome-panel, .delib-closure")
            if outcome.count() == 0:
                # 可能还在播放
                end_btn = page.get_by_role("button", name=re.compile(r"回工作台|返回", re.I))
                if end_btn.count():
                    pass
                else:
                    add(report, "P2", "审议结束", "演示结束后不易找到「结果一览」")
        else:
            add(report, "P1", "工作台", "无「演示审议」入口")

        # ── 4. 可发现性：术语扫描 ──
        jargon_hits = []
        for term in ["Decision Packet", "PROBE", "META", "contract"]:
            if term in wb_text or term in page.locator("body").inner_text():
                jargon_hits.append(term)
        if jargon_hits:
            add(report, "P2", "术语", "小白可能不懂的术语出现在界面", ", ".join(jargon_hits))

        # ── 5. 健康检查 API ──
        try:
            hc = page.request.get(f"{BASE}/api/health")
            data = hc.json()
            add_step(report, "API /api/health", hc.ok, f"aiConfigured={data.get('aiConfigured')}")
            if not hc.ok:
                add(report, "P1", "API", "健康检查失败", str(hc.status))
        except Exception as e:
            add(report, "P1", "API", "健康检查请求异常", str(e))

        # ── 6. 控制台错误汇总 ──
        if report["consoleErrors"]:
            uniq = {e["text"] for e in report["consoleErrors"]}
            for t in list(uniq)[:8]:
                add(report, "P2", "浏览器控制台", "warning/error", t[:300])

        if report["pageErrors"]:
            for t in report["pageErrors"][:5]:
                add(report, "P0", "页面异常", "未捕获 JS 错误", t[:300])

        browser.close()

    report["summary"] = {
        "total_issues": len(report["issues"]),
        "P0": sum(1 for i in report["issues"] if i["severity"] == "P0"),
        "P1": sum(1 for i in report["issues"] if i["severity"] == "P1"),
        "P2": sum(1 for i in report["issues"] if i["severity"] == "P2"),
        "P3": sum(1 for i in report["issues"] if i["severity"] == "P3"),
        "steps_passed": sum(1 for s in report["steps"] if s["ok"]),
        "steps_total": len(report["steps"]),
    }
    _write(report)
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    return 0 if report["summary"]["P0"] == 0 else 1


def _write(report):
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Report: {REPORT_PATH}")


if __name__ == "__main__":
    sys.exit(main())