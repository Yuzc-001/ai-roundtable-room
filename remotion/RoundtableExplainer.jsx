import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const clamp = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
};

const enter = (frame, start, duration = 36) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: ease,
  });

const exit = (frame, start, duration = 28) =>
  interpolate(frame, [start, start + duration], [1, 0], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });

const windowOpacity = (frame, start, end) =>
  enter(frame, start) * exit(frame, end);

const palette = {
  ink: '#16261f',
  muted: '#6f796f',
  line: '#dfe3d4',
  paper: '#f7f6ee',
  green: '#1f4c41',
  gold: '#b4894c',
  red: '#b96f63',
  blue: '#6f859e',
  purple: '#9a87bd',
};

const roles = [
  { name: '渡', label: '主持定调', color: palette.gold, x: 250, y: 680 },
  { name: '灼', label: '强观点', color: palette.red, x: 555, y: 455 },
  { name: '砺', label: '风险拆解', color: palette.blue, x: 960, y: 350 },
  { name: '衡', label: '证据校准', color: palette.green, x: 1365, y: 455 },
  { name: '漾', label: '用户视角', color: '#c47d55', x: 1670, y: 680 },
];

const phases = ['定调', '发散', '暴露', '质询', '收拢', '裁定'];

export const RoundtableExplainer = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: palette.paper,
        color: palette.ink,
        fontFamily:
          '"Inter", "PingFang SC", "Microsoft YaHei", Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      <Texture />
      <TopBar frame={frame} />
      <Opening frame={frame} />
      <ScreenshotScene
        frame={frame}
        start={145}
        end={315}
        title="第一步，把模糊问题放进审议桌"
        subtitle="问题、协议、项目记忆同时进入上下文，角色不再各说各话。"
        image="remotion/home-idle.png"
        callouts={[
          { label: '复杂问题入口', x: 245, y: 28, w: 700, h: 70 },
          { label: '审议协议', x: 16, y: 320, w: 230, h: 210 },
          { label: '项目情报', x: 1115, y: 70, w: 260, h: 250 },
        ]}
      />
      <ScreenshotScene
        frame={frame}
        start={330}
        end={555}
        title="第二步，角色按阶段发言和互相约束"
        subtitle="每一轮都会留下立场、证据、分歧和置信度，不只是聊天记录。"
        image="remotion/live-meeting.png"
        callouts={[
          { label: '发言角色', x: 610, y: 105, w: 185, h: 175 },
          { label: '审议现场', x: 280, y: 300, w: 790, h: 395 },
          { label: '开放问题', x: 1035, y: 515, w: 170, h: 160 },
        ]}
      />
      <DecisionScene frame={frame} />
      <FooterPulse frame={frame} />
    </AbsoluteFill>
  );
};

const TopBar = ({ frame }) => {
  const show = enter(frame, 0);

  return (
    <div
      style={{
        position: 'absolute',
        top: 42,
        left: 64,
        right: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: show,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background:
              'conic-gradient(from 90deg, #1f4c41, #b4894c, #b96f63, #9a87bd, #1f4c41)',
          }}
        />
        <div style={{ fontSize: 30, fontWeight: 800 }}>AI 圆桌智库</div>
      </div>
      <div
        style={{
          border: `1px solid ${palette.line}`,
          borderRadius: 8,
          color: palette.muted,
          fontSize: 22,
          padding: '12px 18px',
          background: 'rgba(255,255,255,0.72)',
        }}
      >
        从复杂问题到可复查决策
      </div>
    </div>
  );
};

const Opening = ({ frame }) => {
  const opacity = windowOpacity(frame, 0, 150);
  const titleIn = enter(frame, 12, 42);
  const questionIn = enter(frame, 58, 36);
  const flowIn = enter(frame, 82, 45);

  return (
    <AbsoluteFill style={{ opacity }}>
      <div
        style={{
          position: 'absolute',
          left: 170,
          top: 210,
          width: 760,
          transform: `translateY(${interpolate(titleIn, [0, 1], [44, 0])}px)`,
          opacity: titleIn,
        }}
      >
        <div
          style={{
            color: palette.gold,
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: 4,
            marginBottom: 26,
          }}
        >
          STRUCTURED DELIBERATION
        </div>
        <div style={{ fontSize: 82, lineHeight: 1.08, fontWeight: 900 }}>
          让 AI 会议
          <br />
          真的能收束
        </div>
        <div
          style={{
            marginTop: 34,
            color: palette.muted,
            fontSize: 30,
            lineHeight: 1.55,
            width: 690,
          }}
        >
          不只是多角色发言，而是把问题、证据、风险、分歧和行动项沉淀成一个决策包。
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 150,
          top: 190,
          width: 690,
          height: 710,
          opacity: questionIn,
          transform: `scale(${interpolate(questionIn, [0, 1], [0.96, 1])})`,
        }}
      >
        <RoleConstellation frame={frame} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 170,
          bottom: 120,
          display: 'flex',
          gap: 14,
          opacity: flowIn,
        }}
      >
        {['复杂问题', '结构化审议', 'Decision Packet', '项目记忆'].map(
          (item, index) => (
            <div
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                fontSize: 24,
                fontWeight: 800,
                color: index === 2 ? palette.green : palette.ink,
              }}
            >
              <span
                style={{
                  border: `1px solid ${palette.line}`,
                  borderRadius: 8,
                  padding: '16px 22px',
                  background: 'rgba(255,255,255,0.78)',
                  boxShadow: '0 18px 50px rgba(44, 55, 45, 0.08)',
                }}
              >
                {item}
              </span>
              {index < 3 ? (
                <span style={{ color: palette.gold, fontSize: 28 }}>→</span>
              ) : null}
            </div>
          ),
        )}
      </div>
    </AbsoluteFill>
  );
};

const RoleConstellation = ({ frame }) => (
  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    <div
      style={{
        position: 'absolute',
        inset: 90,
        border: `1px solid ${palette.line}`,
        borderRadius: '50%',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 180,
        right: 180,
        top: 345,
        height: 2,
        background: palette.line,
      }}
    />
    {roles.map((role, index) => {
      const delay = 34 + index * 10;
      const show = enter(frame, delay, 26);
      const float = Math.sin((frame + index * 18) / 24) * 8;
      return (
        <div
          key={role.name}
          style={{
            position: 'absolute',
            left: role.x / 2.85,
            top: role.y / 1.55 + float,
            transform: `translate(-50%, -50%) scale(${interpolate(show, [0, 1], [0.7, 1])})`,
            opacity: show,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 108,
              height: 108,
              borderRadius: 8,
              display: 'grid',
              placeItems: 'center',
              fontSize: 54,
              fontWeight: 800,
              color: role.color,
              background: '#fffef9',
              border: `2px solid ${role.color}55`,
              boxShadow: `0 18px 45px ${role.color}26`,
            }}
          >
            {role.name}
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 20,
              fontWeight: 800,
              color: palette.muted,
            }}
          >
            {role.label}
          </div>
        </div>
      );
    })}
  </div>
);

const ScreenshotScene = ({ frame, start, end, title, subtitle, image, callouts }) => {
  const opacity = windowOpacity(frame, start, end);
  const slide = enter(frame, start + 10, 42);
  const local = frame - start;

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translateY(${interpolate(slide, [0, 1], [42, 0])}px)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 138,
          width: 470,
          zIndex: 5,
        }}
      >
        <div style={{ color: palette.gold, fontSize: 24, fontWeight: 900 }}>
          0{start === 145 ? 1 : 2}
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 40,
            lineHeight: 1.15,
            fontWeight: 900,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 25,
            lineHeight: 1.55,
            color: palette.muted,
          }}
        >
          {subtitle}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 610,
          top: 150,
          width: 1210,
          height: 670,
          borderRadius: 8,
          background: '#fffef9',
          border: `1px solid ${palette.line}`,
          boxShadow: '0 32px 90px rgba(30, 43, 34, 0.15)',
          overflow: 'hidden',
        }}
      >
        <Img
          src={staticFile(image)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {callouts.map((callout, index) => (
          <Callout
            key={callout.label}
            callout={callout}
            progress={enter(local, 50 + index * 18, 28)}
          />
        ))}
      </div>

      <PhaseRail frame={frame} start={start + 80} />
    </AbsoluteFill>
  );
};

const Callout = ({ callout, progress }) => (
  <div
    style={{
      position: 'absolute',
      left: callout.x,
      top: callout.y,
      width: callout.w,
      height: callout.h,
      border: `4px solid ${palette.gold}`,
      borderRadius: 8,
      opacity: progress,
      boxShadow: `0 0 0 ${interpolate(progress, [0, 1], [0, 10])}px rgba(180,137,76,0.12)`,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 14,
        top: -42,
        background: palette.green,
        color: '#fff',
        borderRadius: 8,
        padding: '9px 14px',
        fontSize: 20,
        fontWeight: 900,
        whiteSpace: 'nowrap',
      }}
    >
      {callout.label}
    </div>
  </div>
);

const PhaseRail = ({ frame, start }) => (
  <div
    style={{
      position: 'absolute',
      left: 150,
      bottom: 116,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      opacity: enter(frame, start, 28),
    }}
  >
    {phases.map((phase, index) => {
      const active = enter(frame, start + index * 12, 18);
      return (
        <div
          key={phase}
          style={{
            borderRadius: 8,
            padding: '14px 18px',
            fontSize: 22,
            fontWeight: 900,
            color: active > 0.75 ? '#fff' : palette.muted,
            background: active > 0.75 ? palette.green : 'rgba(255,255,255,0.8)',
            border: `1px solid ${palette.line}`,
          }}
        >
          {phase}
        </div>
      );
    })}
  </div>
);

const DecisionScene = ({ frame }) => {
  const opacity = enter(frame, 545, 40);
  const cards = [
    { title: '少数派报告', body: '保留没有被采纳但值得警惕的反对意见。' },
    { title: '重开条件', body: '写清哪些信号出现后，需要重新审议。' },
    { title: '行动项', body: '把下一步变成 Owner、动作和验收口径。' },
    { title: '项目记忆', body: '批准后的结论、风险和分歧进入长期上下文。' },
  ];

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translateY(${interpolate(opacity, [0, 1], [44, 0])}px)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 145,
          top: 165,
          width: 670,
        }}
      >
        <div style={{ color: palette.gold, fontSize: 24, fontWeight: 900 }}>
          03
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 62,
            lineHeight: 1.08,
            fontWeight: 900,
          }}
        >
          最后输出的不是聊天记录
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 28,
            lineHeight: 1.55,
            color: palette.muted,
          }}
        >
          它会把审议过程压成一份可复查、可继续使用的 Decision Packet。
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 145,
          top: 150,
          width: 820,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 22,
        }}
      >
        {cards.map((card, index) => {
          const show = enter(frame, 585 + index * 18, 28);
          return (
            <div
              key={card.title}
              style={{
                minHeight: 220,
                borderRadius: 8,
                padding: 34,
                background: '#fffef9',
                border: `1px solid ${palette.line}`,
                boxShadow: '0 24px 70px rgba(30, 43, 34, 0.1)',
                opacity: show,
                transform: `translateY(${interpolate(show, [0, 1], [26, 0])}px)`,
              }}
            >
              <div
                style={{
                  color: index % 2 === 0 ? palette.green : palette.gold,
                  fontSize: 28,
                  fontWeight: 900,
                  marginBottom: 18,
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  color: palette.muted,
                  fontSize: 24,
                  lineHeight: 1.52,
                }}
              >
                {card.body}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 145,
          bottom: 130,
          right: 145,
          height: 150,
          borderRadius: 8,
          background: palette.green,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 52px',
          boxShadow: '0 30px 90px rgba(31, 76, 65, 0.28)',
          opacity: enter(frame, 650, 35),
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 900 }}>
          复杂问题进入圆桌，清晰决策留在项目里
        </div>
        <div
          style={{
            borderRadius: 8,
            background: 'rgba(255,255,255,0.14)',
            padding: '18px 24px',
            fontSize: 24,
            fontWeight: 900,
          }}
        >
          npm run video:studio
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FooterPulse = ({ frame }) => {
  const progress = interpolate(Math.sin(frame / 18), [-1, 1], [0.35, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        bottom: 44,
        width: 13,
        height: 13,
        borderRadius: '50%',
        background: palette.gold,
        opacity: progress,
      }}
    />
  );
};

const Texture = () => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at 28% 18%, rgba(180,137,76,0.14), transparent 28%), radial-gradient(circle at 78% 26%, rgba(154,135,189,0.12), transparent 26%), radial-gradient(circle at 50% 92%, rgba(31,76,65,0.12), transparent 30%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'linear-gradient(rgba(22,38,31,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(22,38,31,0.035) 1px, transparent 1px)',
        backgroundSize: '54px 54px',
        opacity: 0.45,
      }}
    />
  </>
);
