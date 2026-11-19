import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { structuredResumeToText } from "../server/lib/resume.ts";

const prisma = new PrismaClient();

const demoStructuredResume = {
  basics: {
    name: "林若曦",
    phone: "13800138000",
    email: "student@demo.local",
    targetRole: "产品运营实习生",
    educationSummary: "华东理工大学信息管理与信息系统本科，具备用户调研、活动执行和数据整理基础。",
  },
  education: [
    {
      id: "edu-seed-1",
      school: "华东理工大学",
      major: "信息管理与信息系统",
      degree: "本科",
      startDate: "2021-09",
      endDate: "2025-06",
      details: "主修课程包括市场调研、数据分析、管理信息系统；获校级奖学金。",
    },
  ],
  experiences: [
    {
      id: "exp-seed-1",
      type: "校园经历" as const,
      title: "学生会宣传部干事",
      period: "2022-09 - 2023-07",
      role: "活动宣传与内容运营",
      bullets: [
        "负责 6 场校园活动海报与公众号推送，累计触达 3000+ 名学生。",
        "协助整理活动报名与反馈数据，输出复盘结论支持后续活动优化。",
      ],
    },
    {
      id: "exp-seed-2",
      type: "项目" as const,
      title: "校园二手交易小程序",
      period: "2023-10 - 2024-01",
      role: "需求分析与用户调研",
      bullets: [
        "访谈 30 位同学，提炼 3 个核心痛点并形成需求优先级。",
        "参与竞品分析与页面原型整理，协助团队优化发布和搜索流程。",
      ],
    },
  ],
  skills: {
    professional: ["用户调研", "需求分析", "活动复盘"],
    tools: ["Excel", "PowerPoint", "Axure"],
    certificates: ["大学英语四级"],
    languages: ["英语 CET-4"],
  },
  selfEvaluation: "善于沟通协作，能快速整理用户反馈并沉淀为可执行建议，希望在产品运营方向持续成长。",
};

async function upsertShareTag(name: string) {
  return prisma.shareTag.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function upsertDiscussionTag(name: string) {
  return prisma.discussionTag.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function main() {
  const studentPasswordHash = await bcrypt.hash("123456", 10);
  const teacherPasswordHash = await bcrypt.hash("123456", 10);

  const student = await prisma.user.upsert({
    where: { email: "student@demo.local" },
    update: {
      name: "林若曦",
      role: "student",
      school: "华东理工大学",
      major: "信息管理与信息系统",
      targetRole: "产品运营实习生",
      phone: "13800138000",
      passwordHash: studentPasswordHash,
    },
    create: {
      email: "student@demo.local",
      name: "林若曦",
      role: "student",
      school: "华东理工大学",
      major: "信息管理与信息系统",
      targetRole: "产品运营实习生",
      phone: "13800138000",
      passwordHash: studentPasswordHash,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@demo.local" },
    update: {
      name: "张颖",
      role: "teacher",
      school: "华东理工大学",
      major: "就业指导中心",
      targetRole: "就业指导教师",
      passwordHash: teacherPasswordHash,
    },
    create: {
      email: "teacher@demo.local",
      name: "张颖",
      role: "teacher",
      school: "华东理工大学",
      major: "就业指导中心",
      targetRole: "就业指导教师",
      passwordHash: teacherPasswordHash,
    },
  });

  const resumeContent = structuredResumeToText(demoStructuredResume);
  await prisma.resume.upsert({
    where: { userId: student.id },
    update: {
      content: resumeContent,
      structuredJson: JSON.stringify(demoStructuredResume),
    },
    create: {
      userId: student.id,
      content: resumeContent,
      structuredJson: JSON.stringify(demoStructuredResume),
    },
  });

  const existingAnalysis = await prisma.resumeAnalysis.count({ where: { userId: student.id } });
  if (!existingAnalysis) {
    await prisma.resumeAnalysis.create({
      data: {
        userId: student.id,
        resumeContent,
        score: 78,
        completenessJson: JSON.stringify(["教育背景信息已识别", "项目/实践经历已覆盖", "技能工具区已覆盖"]),
        issuesJson: JSON.stringify([
          "项目成果缺少量化结果，可信度偏弱",
          "部分经历描述仍偏职责罗列，可进一步突出结果",
          "与目标岗位强相关关键词仍可继续补充",
        ]),
        keywordJson: JSON.stringify(["用户调研", "需求分析", "竞品研究", "数据分析"]),
        fitJson: JSON.stringify([
          "将经历改写为场景-动作-结果结构，更符合招聘阅读习惯",
          "把调研、活动执行、跨团队协作相关内容前置展示",
        ]),
        strengthsJson: JSON.stringify(["具备校园实践基础，适合继续强化调研与运营表达"]),
      },
    });
  }

  const existingJob = await prisma.jobAnalysis.count({ where: { userId: student.id } });
  if (!existingJob) {
    await prisma.jobAnalysis.create({
      data: {
        userId: student.id,
        jobName: "产品运营实习生",
        jobDescription: "负责用户增长活动策划与执行，协助用户调研、数据复盘和需求分析。",
        score: 74,
        keywordsJson: JSON.stringify(["用户调研", "需求分析", "数据分析", "活动策划"]),
        strengthsJson: JSON.stringify(["简历中已经体现与岗位对应的用户调研和活动支持能力"]),
        gapsJson: JSON.stringify(["需要继续强化数据分析表达", "缺少更完整的活动策划案例"]),
        deliveryAdviceJson: JSON.stringify([
          "投递前先把 JD 高频词写入简历标题、项目描述和技能区",
          "可优先投递运营、用户研究支持、产品助理等相近岗位",
        ]),
        directionsJson: JSON.stringify(["产品运营", "用户运营", "内容运营"]),
      },
    });
  }

  const sharePosts = [
    {
      title: "把校园项目改成招聘方看得懂的成果表达，我只做了三步",
      excerpt: "从“做了什么”改成“解决了什么、带来了什么结果”，简历通过率明显提升。",
      content:
        "我之前的项目经历写得很像流水账，后来把每段经历拆成场景、动作、结果三部分，再补一条量化成果。比如把“负责问卷整理”改成“整理 120 份问卷并提炼 3 个用户痛点，支持后续功能优先级调整”。",
      category: "简历优化经验",
      likes: 128,
      views: 1260,
      favorites: 318,
      isHot: true,
      tags: ["量化表达", "项目经历", "简历优化"],
    },
    {
      title: "一次产品运营面试复盘：面试官最在意的不是经历多少，而是复盘深度",
      excerpt: "同样是校园活动经历，能否讲清目标、策略和复盘，差异会非常明显。",
      content:
        "我被追问最多的是“你怎么判断活动有效”。所以建议大家在复盘时准备目标、数据、问题、优化这四层内容，不然很容易停留在执行层。",
      category: "面试复盘",
      likes: 96,
      views: 980,
      favorites: 207,
      isHot: true,
      tags: ["面试复盘", "运营岗位", "STAR"],
    },
    {
      title: "没有实习经历，简历怎么写出内容感？",
      excerpt: "把课程项目、社团和校园活动按“目标-动作-结果”重新包装，也能很有说服力。",
      content:
        "我一开始也觉得没实习就写不出东西。后来把课程大作业、社团拉新、竞赛这些经历都拆成目标、动作、结果来写，再补上数据，简历立刻丰满了不少。关键是别只写“参与”，要写清楚你具体做了什么、带来了什么。",
      category: "简历优化经验",
      likes: 86,
      views: 1050,
      favorites: 214,
      isHot: true,
      tags: ["无实习", "校园经历", "简历优化"],
    },
    {
      title: "秋招投递 30 家公司后，我总结的投递节奏",
      excerpt: "海投不是乱投，按“冲刺-匹配-保底”分层，效率高很多。",
      content:
        "我把岗位分成冲刺、匹配、保底三层，每层控制投递比例，并且做了投递记录表跟踪进度。这样既不会因为全投大厂而焦虑，也能保证有反馈。建议每周固定时间集中投递和复盘。",
      category: "秋招/春招经验",
      likes: 73,
      views: 920,
      favorites: 168,
      isHot: false,
      tags: ["秋招", "投递策略", "时间管理"],
    },
    {
      title: "实习第一天就被安排做竞品分析，我是这样上手的",
      excerpt: "没有头绪时，先搭框架再填内容，比漫无目的地翻资料高效得多。",
      content:
        "带教让我做竞品分析，我一开始完全没方向。后来先按“产品定位-目标用户-核心功能-运营策略-差异化”搭好框架，再逐个去查资料填充，最后输出一页结论。这样既显得有结构，也容易让带教给你反馈。",
      category: "实习投递经验",
      likes: 64,
      views: 780,
      favorites: 122,
      isHot: false,
      tags: ["实习", "竞品分析", "学习方法"],
    },
    {
      title: "offer 二选一：大厂边缘岗位还是小厂核心岗位？",
      excerpt: "核心不是平台大小，而是你能在岗位上学到什么、有没有成长空间。",
      content:
        "我最后选了小厂核心岗，理由是能直接参与业务、成长更快。大厂边缘岗位虽然平台大，但做的事情偏执行，成长反而慢。建议大家把“岗位职责、带教质量、成长空间”这三项权重调高，再看平台。",
      category: "offer选择建议",
      likes: 58,
      views: 690,
      favorites: 96,
      isHot: false,
      tags: ["offer选择", "职业规划"],
    },
    {
      title: "群面总是插不上话？试试这三个方法",
      excerpt: "群面不是比谁说得多，而是比谁说得准、有没有推动讨论。",
      content:
        "一是开场先定框架，二是别人说完先总结再补充，三是适时把跑偏的话题拉回来。做到这三点，哪怕你话不多，面试官也会觉得你有逻辑、有协作意识。",
      category: "面试提问准备",
      likes: 47,
      views: 560,
      favorites: 88,
      isHot: false,
      tags: ["群面", "面试技巧"],
    },
    {
      title: "简历被刷后我复盘出的 5 个致命问题",
      excerpt: "没有岗位关键词、成果不量化、排版太乱，是最常见的三个坑。",
      content:
        "复盘下来最致命的五个问题：一是不看 JD 直接投，二是经历只写职责不写成果，三是没有量化数据，四是技能和岗位对不上，五是排版让人抓不住重点。改完这五点，通过率明显上来了。",
      category: "简历优化经验",
      likes: 39,
      views: 480,
      favorites: 71,
      isHot: false,
      tags: ["简历复盘", "简历优化"],
    },
  ];

  for (const item of sharePosts) {
    const exists = await prisma.sharePost.findFirst({ where: { title: item.title } });
    if (!exists) {
      const created = await prisma.sharePost.create({
        data: {
          authorId: student.id,
          title: item.title,
          excerpt: item.excerpt,
          content: item.content,
          category: item.category,
          likes: item.likes,
          views: item.views,
          favorites: item.favorites,
          isHot: item.isHot,
        },
      });

      for (const tagName of item.tags) {
        const tag = await upsertShareTag(tagName);
        await prisma.sharePostTag.create({
          data: { postId: created.id, tagId: tag.id },
        });
      }
    }
  }

  const discussions = [
    {
      title: "没有正式实习，秋招投产品运营会不会太吃亏？",
      content:
        "目前只有校园活动和课程项目经历，没有大厂实习。想投产品运营或用户运营岗位，担心简历竞争力不够。大家会建议先补项目还是直接投递？",
      category: "岗位选择",
      status: "热门",
      views: 842,
      tags: ["秋招", "产品运营", "项目补充"],
      replies: [
        { authorId: teacher.id, content: "可以先投，但要把校园项目改写成岗位语言，同时准备一段完整的活动复盘案例。" },
        { authorId: student.id, content: "我去年也是类似情况，靠 2 个高质量项目和一段社团增长案例拿到了面试机会。" },
      ],
    },
    {
      title: "简历技能区到底写软件工具还是写通用能力？",
      content:
        "技能区空间有限，不知道应该优先写 Excel、SQL、Axure 这些工具，还是写沟通协作、责任心之类的能力。",
      category: "简历提问",
      status: "已解决",
      views: 406,
      tags: ["简历技能区", "工具能力"],
      replies: [
        { authorId: teacher.id, content: "优先写可验证、可对应岗位要求的工具和方法，通用能力尽量放在经历里体现。" },
      ],
    },
    {
      title: "暑期实习和秋招冲突了，该怎么取舍？",
      content:
        "暑期实习 offer 和秋招提前批时间撞上了。如果去做实习，可能错过一些提前批；不做实习又怕简历没亮点。大家会怎么选？",
      category: "岗位选择",
      status: "热门",
      views: 730,
      tags: ["暑期实习", "秋招", "时间冲突"],
      replies: [
        { authorId: teacher.id, content: "如果实习是目标行业的核心岗，建议优先实习，秋招正式批还有机会；如果实习含金量一般，可以重点冲秋招。" },
      ],
    },
    {
      title: "转行做运营，没有对口项目怎么办？",
      content:
        "我是理工科背景，想转产品运营，但没有相关实习和项目。靠自己做一些分析报告或拆解案例，简历上能不能写？",
      category: "简历提问",
      status: "讨论中",
      views: 512,
      tags: ["转行", "运营", "简历"],
      replies: [],
    },
    {
      title: "AI 面试官会问哪些问题，怎么准备？",
      content:
        "最近很多公司用 AI 进行初面，想问下 AI 面试一般考什么，和真人面试有什么不同，该怎么针对性准备？",
      category: "面试问答",
      status: "热门",
      views: 645,
      tags: ["AI面试", "初面", "面试准备"],
      replies: [
        { authorId: student.id, content: "AI 面试更看重结构化和关键词，回答时用 STAR 结构、语速平稳、避免卡顿，会比较稳。" },
      ],
    },
    {
      title: "第一份工作选大平台还是选高薪？",
      content:
        "手里两个 offer：大平台薪资一般，小公司给得高。作为应届生，第一份工作更应该看重平台还是薪资？",
      category: "offer选择",
      status: "已解决",
      views: 588,
      tags: ["offer选择", "应届生", "职业规划"],
      replies: [
        { authorId: teacher.id, content: "应届生前三年优先看平台和成长，薪资差异如果不大，建议选能给你更多实战和带教机会的那家。" },
      ],
    },
    {
      title: "简历里要不要写不相关的兼职经历？",
      content:
        "大学做过奶茶店兼职、家教这些，和求职方向没关系。简历空间有限，这些经历到底写不写？",
      category: "简历提问",
      status: "讨论中",
      views: 434,
      tags: ["简历", "兼职经历"],
      replies: [],
    },
    {
      title: "秋招海投是不是效率很低？",
      content:
        "身边同学都在海投，我也跟着投了一百多家，但回应很少。是不是应该把精力集中在少数目标岗位上？",
      category: "岗位选择",
      status: "讨论中",
      views: 356,
      tags: ["秋招", "海投", "求职策略"],
      replies: [],
    },
  ];

  for (const item of discussions) {
    const exists = await prisma.discussionPost.findFirst({ where: { title: item.title } });
    if (!exists) {
      const created = await prisma.discussionPost.create({
        data: {
          authorId: student.id,
          title: item.title,
          content: item.content,
          category: item.category,
          status: item.status,
          views: item.views,
        },
      });

      for (const tagName of item.tags) {
        const tag = await upsertDiscussionTag(tagName);
        await prisma.discussionPostTag.create({
          data: { postId: created.id, tagId: tag.id },
        });
      }

      for (const reply of item.replies) {
        await prisma.discussionReply.create({
          data: {
            postId: created.id,
            authorId: reply.authorId,
            content: reply.content,
          },
        });
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
