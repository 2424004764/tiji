/**
 * 共享国际化资源：领域命名的文案 key（如 `activity.start`），
 * 组件内禁止硬编码用户可见文案。占位符用 `{name}`；
 * 英文复数用 `1 question | {n} questions` 语法（`|` 前为 n=1，后为其他）。
 */
export const defaultLocale = 'zh-CN' as const
export const localeCookieName = 'tiji_locale'
export const localeCookieMaxAge = 60 * 60 * 24 * 365

export const locales = [
  { code: 'zh-CN', name: '简体中文', switchLabel: '中文', switchAria: '切换到简体中文' },
  { code: 'en-US', name: 'English', switchLabel: 'EN', switchAria: 'Switch to English' }
] as const

const zhCN = {
  common: {
    appName: '题迹',
    tagline: '自建题库与答题反馈工具',
    defaultTitle: '题迹｜创建、分享与复习题目',
    defaultDescription: '题迹是一个轻量的刷题、题库和答题反馈平台。',
    loading: '加载中…',
    backHome: '返回首页',
    goLogin: '前往登录',
    myBanks: '我的题库',
    requestFailed: '请求失败，请稍后重试。',
    optionTrue: '正确',
    optionFalse: '错误',
    listSeparator: '、',
    notAnswered: '未作答',
    questionCount: '{n} 道题',
    needLoginTitle: '请先登录'
  },
  locale: { aria: '切换语言' },
  nav: {
    how: '如何运作',
    features: '功能',
    myBanks: '我的题库',
    login: '登录',
    logout: '退出',
    primaryAria: '页面导航',
    homeAria: '题迹首页'
  },
  home: {
    seo: {
      title: '题迹｜自建题库，一条链接开始刷题',
      description: '为班级、小组或自己创建题库，分享链接即可答题，错题、收藏与练习记录自动整理。',
      ogTitle: '题迹｜自建题库，一条链接开始刷题',
      ogDescription: '创建题库、发布答题活动、查看每题反馈，学习轨迹一目了然。'
    },
    hero: {
      titleTop: '出题、分享、刷题，',
      titleLead: '留下进步的',
      titleEm: '轨迹',
      titleTail: '。',
      sub: '为班级、小组或自己创建题库，一条链接即可开始答题，错题与练习记录自动整理。',
      ctaPrimary: '免费创建题库',
      ctaSecondary: '了解如何运作',
      demoAria: '题迹答题示例'
    },
    demo: {
      tag: '示例',
      finished: '已完成',
      correct: '回答正确。',
      correctAnswerIs: '正确答案是「{answer}」。',
      next: '下一题',
      seeResults: '查看结果',
      resultText: '示例结束。真实的答题活动里，得分、用时和每题反馈都会记入创建者的结果页。',
      retry: '再试一次',
      correctLabel: '正确答案',
      yourLabel: '你的回答',
      q1: {
        type: '单选题',
        stem: '地球上现存体型最大的动物是哪一种？',
        a: '非洲象',
        b: '蓝鲸',
        c: '长颈鹿',
        d: '虎鲸',
        explain: '蓝鲸是地球生命史上已知最大的动物，成年体长可达 30 米。'
      },
      q2: {
        type: '判断题',
        stem: '在题迹中，答错的题目会自动收进错题本。',
        explain: '答错的题会进入错题本，并保留正确答案与解析，方便集中复习。'
      }
    },
    steps: {
      title: '三步，从出题到反馈。',
      s1: { title: '创建题库', desc: '按科目或章节录入题目，支持单选与判断题型，每题可附解析和难度。' },
      s2: { title: '分享链接', desc: '把题库发布为答题活动，任何人点开链接、填一个显示名就能作答，无需注册。' },
      s3: { title: '查看反馈', desc: '参与人数、正确率与每题分析实时汇总，哪里薄弱一眼可见。' }
    },
    features: {
      title: '练过的每一题，都有迹可循。',
      mistakes: {
        title: '错题本',
        desc: '答错的题自动归集，保留正确答案与解析，考前集中攻克。',
        badgeBad: '错题',
        badgeOk: '已掌握',
        sampleBad: '浮力产生的原因',
        sampleOk: '光的折射定律'
      },
      favorites: { title: '收藏夹', desc: '好题、易错题一键收藏，随时回看。' },
      records: { title: '答题记录', desc: '每次练习的得分与用时自动留痕，进步看得见。' },
      anywhere: { title: '多端可练', desc: '电脑、平板、手机的浏览器都能直接使用，登录同一账号随时继续。' }
    },
    cta: { title: '创建你的第一个题库，只需要几分钟。', button: '免费创建题库' },
    footer: {
      navAria: '页脚导航',
      how: '如何运作',
      features: '功能',
      myBanks: '我的题库',
      login: '登录'
    }
  },
  login: {
    seo: { title: '登录 · 题迹', description: '登录题迹，管理你的题库与答题活动。' },
    tabsAria: '登录或注册',
    tabLogin: '登录',
    tabRegister: '注册',
    hintLogin: '欢迎回来，请输入账号信息。',
    hintRegister: '注册后即可创建题库，注册即登录。',
    username: '用户名',
    password: '密码',
    missing: '请输入用户名和密码。',
    submitting: '提交中…',
    submitLogin: '登录',
    submitRegister: '注册并登录',
    loggedHint: '当前已登录为 {name}，无需再次登录。',
    goBanks: '我的题库',
    goHome: '进入首页',
    logout: '退出登录',
    oauth: {
      divider: '或',
      button: '使用一方工具箱账号登录',
      errors: {
        access_denied: '你取消了一方工具箱授权，未完成登录。',
        invalid_state: '登录状态校验失败，请重新发起登录。',
        token_exchange: '一方工具箱授权失败，请稍后重试。',
        userinfo_failed: '获取一方工具箱用户信息失败，请稍后重试。',
        account_disabled: '该账号已被禁用，无法登录。',
        not_configured: '一方工具箱登录暂未配置，请联系管理员。',
        failed: '一方工具箱登录失败，请稍后重试。'
      }
    }
  },
  banks: {
    seo: { title: '我的题库 · 题迹', description: '创建和管理你的题库。' },
    needLoginDesc: '登录后即可创建题库、添加题目并发布答题活动。',
    title: '我的题库',
    summary: '共 {banks} 个题库 · {questions}',
    status: { draft: '草稿', published: '已发布', archived: '已归档' },
    create: {
      title: '创建题库',
      name: '题库名称',
      namePlaceholder: '例如：八年级物理·力学单元',
      description: '描述（可选）',
      descriptionPlaceholder: '简要说明这个题库的用途',
      visibility: '可见性',
      visPrivate: '私密（仅自己可见）',
      visPublic: '公开（可被分享访问）',
      missingName: '请输入题库名称。',
      success: '题库「{name}」创建成功。点进题库即可添加题目并发布答题活动。',
      creating: '创建中…',
      submit: '创建题库'
    },
    list: {
      title: '全部题库',
      error: '题库列表加载失败，请刷新重试。',
      emptyTitle: '还没有题库',
      emptyDesc: '创建第一个题库，添加几道题，就能发布答题活动分享给好友。',
      meta: '{questions} · 更新于 {date}'
    }
  },
  visibility: { private: '私密', public: '公开' },
  question: {
    type: { single: '单选', multiple: '多选', tf: '判断' },
    difficulty: { d1: '简单', d2: '较易', d3: '中等', d4: '较难', d5: '困难' },
    answerPrefix: '正确答案：',
    typesAria: '题型'
  },
  bank: {
    seo: { title: '题库详情 · 题迹' },
    needLoginDesc: '登录后即可管理题库和题目。',
    notFoundTitle: '题库不存在',
    notFoundDesc: '它可能已被删除，或者不属于当前账号。',
    backToBanks: '返回我的题库',
    questionBadge: '{n} 道题',
    share: {
      title: '分享答题',
      privateHint: '题库当前为{state}。先在下方「题库设置」中把可见性改为公开，才能发布分享。',
      liveHint: '把下面的链接发给好友，好友打开后输入显示名即可答题，无需注册。',
      copied: '已复制',
      copyLink: '复制链接',
      endActivity: '结束活动',
      syncing: '同步中…',
      syncLatest: '同步最新题目',
      syncTitle: '修改题库题目后，同步到进行中的活动',
      viewResults: '查看答题情况',
      syncSuccess: '已同步题库最新内容到答题活动。',
      liveStatus: '活动进行中：好友提交后，点击「查看答题情况」即可看到每人的得分与逐题对错。',
      endedHint: '上一个活动已结束，可以发布一个新的分享链接。',
      freshHint: '发布后生成一条分享链接，好友无需注册即可答题。',
      publishing: '发布中…',
      republish: '重新发布活动',
      publish: '发布答题活动',
      needQuestion: '请先添加至少一道题目，再发布答题活动。',
      viewLastResults: '查看上一个活动的答题情况',
      endConfirm: '确定结束这个答题活动吗？结束后好友将无法继续作答。',
      copyPrompt: '请手动复制链接：'
    },
    add: {
      title: '添加题目',
      typeChoice: '选择题',
      typeTf: '判断题',
      stem: '题干',
      stemPlaceholder: '输入题目内容',
      optionPlaceholder: '选项内容',
      addOption: '+ 添加选项',
      choiceHint: '勾选 1 个正确答案为单选题，勾选 2 个及以上为多选题。',
      checkTitle: '勾选正确答案，勾两个及以上即为多选题',
      removeOption: '删除选项',
      explanation: '解析（可选）',
      explanationPlaceholder: '答题后展示的答案解析',
      difficulty: '难度',
      tags: '分类标签（用逗号分隔）',
      tagsPlaceholder: '例如：力学, 浮力',
      missingStem: '请输入题干。',
      missingOptions: '选择题至少需要填写两个选项。',
      missingAnswer: '请勾选正确答案。',
      missingTfAnswer: '请选择判断题答案。',
      success: '题目已添加。',
      saving: '保存中…',
      submit: '添加题目'
    },
    import: {
      tab: 'Excel 导入',
      hint: '上传 Excel（xlsx / xls / csv）文件，一次导入整批题目，选择题与判断题自动识别。',
      template: '下载模板',
      chooseFile: '选择文件',
      parsed: '识别到 {n} 道题：单选 {single} · 多选 {multiple} · 判断 {tf}',
      rowError: '第 {row} 行：{reason}',
      tooMany: '单次最多导入 100 道题，当前文件有 {n} 行。',
      noRows: '文件里没有识别到题目。',
      parseFailed: '文件解析失败，请确认为 xlsx / xls / csv 格式。',
      importBtn: '导入 {n} 道题',
      importing: '导入中…',
      success: '成功导入 {n} 道题。',
      requestFailed: '导入失败，请稍后重试。',
      errInvalidStem: '缺少题干',
      errInvalidOptions: '选择题至少需要两个选项',
      errInvalidAnswer: '答案缺失、无法识别或超出选项范围'
    },
    list: {
      title: '题目列表',
      error: '题目加载失败，请刷新重试。',
      empty: '还没有题目。在左侧添加第一道题，之后就可以发布答题活动。',
      remove: '删除',
      removeTitle: '删除题目',
      removeConfirm: '确定删除这道题吗？\n{stem}',
      removeFailed: '删除失败，请稍后重试。'
    },
    settings: {
      title: '题库设置',
      name: '题库名称',
      visibility: '可见性（是否可分享）',
      description: '描述',
      descriptionPlaceholder: '简要说明这个题库的用途',
      missingName: '题库名称不能为空。',
      savedPublic: '设置已保存：题库已设为公开。',
      savedPrivate: '设置已保存：题库已设为私密。',
      saving: '保存中…',
      submit: '保存设置'
    }
  },
  quiz: {
    seo: { title: '答题 · 题迹' },
    noQuestions: '这个活动还没有题目。',
    notOpen: '活动已结束或尚未开放。',
    notFound: '活动不存在或链接有误。',
    promoHint: '如果你有题迹账号，可以登录后创建自己的题库和分享活动。',
    promoCta: '去题迹看看',
    inviteEyebrow: '答题邀请',
    fromBank: '来自题库「{name}」',
    meta: '共 {n} 道题 · 无需注册，输入显示名即可开始',
    displayName: '你的显示名',
    displayNamePlaceholder: '例如：小明',
    missingName: '请输入你的显示名。',
    preparing: '准备中…',
    start: '开始答题',
    progress: '第 {current} 题 / 共 {total} 题',
    progressAria: '题目进度',
    answerSheet: '答题卡',
    prev: '← 上一题',
    next: '下一题 →',
    questionAria: '第 {n} 题',
    submitting: '提交中…',
    submit: '提交答卷',
    unansweredConfirm: '还有 {n} 道题未作答，未答的题按错误计分。确定提交吗？',
    sheetDone: '完成',
    sheetAnswered: '已答 {done} / {total}',
    sheetHint: '绿色 = 已作答，点击题号直接跳转',
    confirmAnswer: '确定',
    correct: '回答正确。',
    wrong: '回答错误。',
    correctAnswer: '正确答案',
    explanation: '解析',
    resultEyebrow: '答题完成',
    thanks: '{name}，感谢作答！结果已同步给出题人。',
    review: '返回检查答卷'
  },
  results: {
    seo: { title: '答题情况 · 题迹' },
    needLoginDesc: '登录后即可查看自己活动的答题情况。',
    unableTitle: '无法打开',
    loadFailed: '答题情况加载失败，请刷新重试。',
    backToBank: '返回题库',
    questionCount: '共 {n} 道题 ·',
    status: { draft: '草稿', published: '进行中', paused: '已暂停', ended: '已结束', submitted: '已提交', in_progress: '答题中' },
    statParticipants: '参与人数',
    statSubmitted: '已提交',
    statAverage: '平均得分',
    rosterTitle: '答题名单',
    rosterEmpty: '还没有人参与。把分享链接发给好友后，这里会列出每一位答题者。',
    inProgress: '答题中',
    detailTitle: '作答详情',
    detailFailed: '作答详情加载失败。',
    detailScore: '得分 {score} / {total}',
    notSubmitted: '尚未提交',
    durationPrefix: '用时',
    correct: '答对',
    wrong: '答错',
    givenAnswer: '他的回答：',
    correctAnswer: '正确答案：',
    durationMinutes: '{m} 分 {s} 秒',
    durationSeconds: '{s} 秒'
  },
  api: {
    errors: {
      AUTH_REQUIRED: '请先登录。',
      VALIDATION_ERROR: '提交的内容不完整，请检查后重试。',
      USERNAME_TAKEN: '用户名已存在。',
      INVALID_CREDENTIALS: '用户名或密码错误。',
      NOT_FOUND: '内容不存在或已被删除。',
      FORBIDDEN: '没有权限执行此操作。',
      ACTIVITY_NOT_OPEN: '活动已结束或尚未开放。',
      INTERNAL_ERROR: '服务出现了一点问题，请稍后重试。'
    }
  }
}

export type MessageSchema = typeof zhCN

const enUS: MessageSchema = {
  common: {
    appName: 'Tiji',
    tagline: 'Build question banks and share quizzes with feedback',
    defaultTitle: 'Tiji | Create, share and review questions',
    defaultDescription: 'Tiji is a lightweight platform for question banks, quizzes and answer feedback.',
    loading: 'Loading…',
    backHome: 'Back to home',
    goLogin: 'Log in',
    myBanks: 'My banks',
    requestFailed: 'Request failed. Please try again later.',
    optionTrue: 'True',
    optionFalse: 'False',
    listSeparator: ', ',
    notAnswered: 'Not answered',
    questionCount: '1 question | {n} questions',
    needLoginTitle: 'Please log in first'
  },
  locale: { aria: 'Switch language' },
  nav: {
    how: 'How it works',
    features: 'Features',
    myBanks: 'My banks',
    login: 'Log in',
    logout: 'Log out',
    primaryAria: 'Primary navigation',
    homeAria: 'Tiji home'
  },
  home: {
    seo: {
      title: 'Tiji | Build question banks, share one link, start quizzing',
      description: 'Create question banks for your class, group or yourself. Share a link to quiz, with mistakes, favorites and practice history organized automatically.',
      ogTitle: 'Tiji | Build question banks, share one link, start quizzing',
      ogDescription: 'Create banks, publish quizzes and review per-question feedback — every learning trail in one place.'
    },
    hero: {
      titleTop: 'Create, share, practice —',
      titleLead: 'leave a ',
      titleEm: 'trail',
      titleTail: ' of progress.',
      sub: 'Create question banks for your class, group or yourself. Share one link to start quizzing; mistakes and practice history are organized automatically.',
      ctaPrimary: 'Create a bank for free',
      ctaSecondary: 'See how it works',
      demoAria: 'Tiji quiz demo'
    },
    demo: {
      tag: 'Demo',
      finished: 'Finished',
      correct: 'Correct!',
      correctAnswerIs: 'The correct answer is “{answer}”. ',
      next: 'Next question',
      seeResults: 'See results',
      resultText: 'Demo finished. In a real quiz, the score, time spent and per-question feedback are all recorded on the creator’s results page.',
      retry: 'Try again',
      correctLabel: 'Correct answer',
      yourLabel: 'Your answer',
      q1: {
        type: 'Single choice',
        stem: 'Which is the largest animal alive on Earth today?',
        a: 'African elephant',
        b: 'Blue whale',
        c: 'Giraffe',
        d: 'Orca',
        explain: 'The blue whale is the largest animal known in Earth’s history — adults can reach 30 meters.'
      },
      q2: {
        type: 'True / false',
        stem: 'In Tiji, questions you answer incorrectly are added to your mistake book automatically.',
        explain: 'Wrong answers go into the mistake book with the correct answer and explanation, so you can review them together.'
      }
    },
    steps: {
      title: 'Three steps from writing to feedback.',
      s1: { title: 'Create a bank', desc: 'Add questions by subject or chapter, with single choice and true/false types — each with optional explanation and difficulty.' },
      s2: { title: 'Share a link', desc: 'Publish a bank as a quiz activity. Anyone who opens the link can answer with just a display name — no sign-up.' },
      s3: { title: 'See feedback', desc: 'Participation, accuracy and per-question analysis are summarized in real time, so weak spots stand out.' }
    },
    features: {
      title: 'Every question you practice leaves a trail.',
      mistakes: {
        title: 'Mistake book',
        desc: 'Wrong answers are collected automatically with the correct answer and explanation — perfect for pre-exam review.',
        badgeBad: 'Mistake',
        badgeOk: 'Mastered',
        sampleBad: 'What causes buoyancy',
        sampleOk: 'The law of refraction'
      },
      favorites: { title: 'Favorites', desc: 'Bookmark great or tricky questions and revisit them anytime.' },
      records: { title: 'Practice history', desc: 'Every session’s score and time spent are recorded automatically — progress you can see.' },
      anywhere: { title: 'Practice anywhere', desc: 'Works in desktop, tablet and phone browsers. Log in on any device and pick up where you left off.' }
    },
    cta: { title: 'Create your first question bank in minutes.', button: 'Create a bank for free' },
    footer: {
      navAria: 'Footer navigation',
      how: 'How it works',
      features: 'Features',
      myBanks: 'My banks',
      login: 'Log in'
    }
  },
  login: {
    seo: { title: 'Log in · Tiji', description: 'Log in to Tiji to manage your question banks and quiz activities.' },
    tabsAria: 'Log in or create account',
    tabLogin: 'Log in',
    tabRegister: 'Sign up',
    hintLogin: 'Welcome back. Enter your account details.',
    hintRegister: 'Create an account to start building banks — signing up logs you in.',
    username: 'Username',
    password: 'Password',
    missing: 'Please enter a username and password.',
    submitting: 'Submitting…',
    submitLogin: 'Log in',
    submitRegister: 'Sign up & log in',
    loggedHint: 'You are already logged in as {name}. No need to log in again.',
    goBanks: 'My banks',
    goHome: 'Go to home',
    logout: 'Log out',
    oauth: {
      divider: 'or',
      button: 'Continue with your Yifang Toolbox account',
      errors: {
        access_denied: 'You cancelled the Yifang Toolbox authorization, so the login was not completed.',
        invalid_state: 'Login state verification failed. Please start the login again.',
        token_exchange: 'Yifang Toolbox authorization failed. Please try again later.',
        userinfo_failed: 'Failed to load your Yifang Toolbox profile. Please try again later.',
        account_disabled: 'This account has been disabled and cannot log in.',
        not_configured: 'Yifang Toolbox login is not configured yet. Please contact the administrator.',
        failed: 'Yifang Toolbox login failed. Please try again later.'
      }
    }
  },
  banks: {
    seo: { title: 'My banks · Tiji', description: 'Create and manage your question banks.' },
    needLoginDesc: 'Log in to create banks, add questions and publish quiz activities.',
    title: 'My banks',
    summary: '{banks} in total · {questions}',
    status: { draft: 'Draft', published: 'Published', archived: 'Archived' },
    create: {
      title: 'Create a bank',
      name: 'Bank name',
      namePlaceholder: 'e.g. Grade 8 Physics · Mechanics unit',
      description: 'Description (optional)',
      descriptionPlaceholder: 'Briefly describe what this bank is for',
      visibility: 'Visibility',
      visPrivate: 'Private (only me)',
      visPublic: 'Public (shareable)',
      missingName: 'Please enter a bank name.',
      success: 'Bank “{name}” created. Open it to add questions and publish a quiz activity.',
      creating: 'Creating…',
      submit: 'Create bank'
    },
    list: {
      title: 'All banks',
      error: 'Failed to load banks. Please refresh and retry.',
      emptyTitle: 'No banks yet',
      emptyDesc: 'Create your first bank, add a few questions, then publish a quiz to share with friends.',
      meta: '{questions} · Updated {date}'
    }
  },
  visibility: { private: 'Private', public: 'Public' },
  question: {
    type: { single: 'Single', multiple: 'Multiple', tf: 'True/false' },
    difficulty: { d1: 'Easy', d2: 'Fairly easy', d3: 'Medium', d4: 'Fairly hard', d5: 'Hard' },
    answerPrefix: 'Correct answer: ',
    typesAria: 'Question types'
  },
  bank: {
    seo: { title: 'Bank details · Tiji' },
    needLoginDesc: 'Log in to manage this bank and its questions.',
    notFoundTitle: 'Bank not found',
    notFoundDesc: 'It may have been deleted, or it does not belong to this account.',
    backToBanks: 'Back to my banks',
    questionBadge: '1 question | {n} questions',
    share: {
      title: 'Share quiz',
      privateHint: 'This bank is {state} now. Set visibility to public in “Bank settings” below before publishing.',
      liveHint: 'Send the link below to friends — they open it, enter a display name and start answering. No sign-up needed.',
      copied: 'Copied',
      copyLink: 'Copy link',
      endActivity: 'End activity',
      syncing: 'Syncing…',
      syncLatest: 'Sync latest questions',
      syncTitle: 'Sync question changes into the running activity',
      viewResults: 'View results',
      syncSuccess: 'The latest bank content has been synced to the activity.',
      liveStatus: 'Activity in progress: after friends submit, click “View results” to see each person’s score and per-question answers.',
      endedHint: 'The previous activity has ended. You can publish a new share link.',
      freshHint: 'Publishing generates a share link — friends can answer without signing up.',
      publishing: 'Publishing…',
      republish: 'Publish again',
      publish: 'Publish quiz activity',
      needQuestion: 'Add at least one question before publishing a quiz activity.',
      viewLastResults: 'View results of the previous activity',
      endConfirm: 'End this quiz activity? Friends will no longer be able to submit answers.',
      copyPrompt: 'Copy the link manually:'
    },
    add: {
      title: 'Add question',
      typeChoice: 'Choice',
      typeTf: 'True / false',
      stem: 'Question',
      stemPlaceholder: 'Type the question',
      optionPlaceholder: 'Option text',
      addOption: '+ Add option',
      choiceHint: 'Tick 1 correct answer for single choice; tick 2 or more for multiple choice.',
      checkTitle: 'Tick the correct answer(s); two or more makes it multiple choice',
      removeOption: 'Remove option',
      explanation: 'Explanation (optional)',
      explanationPlaceholder: 'Shown after answering',
      difficulty: 'Difficulty',
      tags: 'Tags (comma separated)',
      tagsPlaceholder: 'e.g. mechanics, buoyancy',
      missingStem: 'Please enter the question.',
      missingOptions: 'Choice questions need at least two options.',
      missingAnswer: 'Please tick the correct answer.',
      missingTfAnswer: 'Please choose the true/false answer.',
      success: 'Question added.',
      saving: 'Saving…',
      submit: 'Add question'
    },
    import: {
      tab: 'Excel import',
      hint: 'Upload an Excel file (xlsx / xls / csv) to import questions in bulk. Choice and true/false types are detected automatically.',
      template: 'Download template',
      chooseFile: 'Choose file',
      parsed: 'Found 1 question: {single} single · {multiple} multiple · {tf} true/false | Found {n} questions: {single} single · {multiple} multiple · {tf} true/false',
      rowError: 'Row {row}: {reason}',
      tooMany: 'At most 100 questions per import — this file has {n} rows.',
      noRows: 'No questions found in the file.',
      parseFailed: 'Failed to read the file. Please use xlsx / xls / csv.',
      importBtn: 'Import 1 question | Import {n} questions',
      importing: 'Importing…',
      success: 'Imported 1 question. | Imported {n} questions.',
      requestFailed: 'Import failed. Please try again later.',
      errInvalidStem: 'missing question text',
      errInvalidOptions: 'choice questions need at least two options',
      errInvalidAnswer: 'answer missing, unrecognized, or out of range'
    },
    list: {
      title: 'Questions',
      error: 'Failed to load questions. Please refresh and retry.',
      empty: 'No questions yet. Add the first one on the left, then publish a quiz activity.',
      remove: 'Delete',
      removeTitle: 'Delete question',
      removeConfirm: 'Delete this question?\n{stem}',
      removeFailed: 'Failed to delete. Please try again later.'
    },
    settings: {
      title: 'Bank settings',
      name: 'Bank name',
      visibility: 'Visibility (shareable or not)',
      description: 'Description',
      descriptionPlaceholder: 'Briefly describe what this bank is for',
      missingName: 'Bank name cannot be empty.',
      savedPublic: 'Settings saved: the bank is now public.',
      savedPrivate: 'Settings saved: the bank is now private.',
      saving: 'Saving…',
      submit: 'Save settings'
    }
  },
  quiz: {
    seo: { title: 'Quiz · Tiji' },
    noQuestions: 'This activity has no questions yet.',
    notOpen: 'This activity has ended or is not open yet.',
    notFound: 'Activity not found or the link is incorrect.',
    promoHint: 'If you have a Tiji account, you can log in and create your own banks and quizzes.',
    promoCta: 'Explore Tiji',
    inviteEyebrow: 'Quiz invitation',
    fromBank: 'From bank “{name}”',
    meta: '{n} in total · no sign-up needed, just enter a display name to start',
    displayName: 'Your display name',
    displayNamePlaceholder: 'e.g. Alex',
    missingName: 'Please enter your display name.',
    preparing: 'Preparing…',
    start: 'Start quiz',
    progress: 'Question {current} / {total}',
    progressAria: 'Question progress',
    answerSheet: 'Answer sheet',
    prev: '← Previous',
    next: 'Next →',
    questionAria: 'Question {n}',
    submitting: 'Submitting…',
    submit: 'Submit answers',
    unansweredConfirm: '1 question is unanswered | {n} questions are unanswered — unanswered ones are scored as incorrect. Submit anyway?',
    sheetDone: 'Done',
    sheetAnswered: '{done} / {total} answered',
    sheetHint: 'Green = answered. Click a number to jump to that question.',
    confirmAnswer: 'Confirm',
    correct: 'Correct!',
    wrong: 'Incorrect.',
    correctAnswer: 'Correct answer',
    explanation: 'Explanation',
    resultEyebrow: 'Quiz complete',
    thanks: 'Thanks for answering, {name}! Your results have been sent to the quiz creator.',
    review: 'Review my answers'
  },
  results: {
    seo: { title: 'Quiz results · Tiji' },
    needLoginDesc: 'Log in to view the results of your quiz activities.',
    unableTitle: 'Cannot open this page',
    loadFailed: 'Failed to load results. Please refresh and retry.',
    backToBank: 'Back to bank',
    questionCount: '{n} in total ·',
    status: { draft: 'Draft', published: 'In progress', paused: 'Paused', ended: 'Ended', submitted: 'Submitted', in_progress: 'Answering' },
    statParticipants: 'Participants',
    statSubmitted: 'Submitted',
    statAverage: 'Average score',
    rosterTitle: 'Respondents',
    rosterEmpty: 'No participants yet. After you share the link, every respondent will be listed here.',
    inProgress: 'Answering',
    detailTitle: 'Answer details',
    detailFailed: 'Failed to load answer details.',
    detailScore: 'Score {score} / {total}',
    notSubmitted: 'Not submitted yet',
    durationPrefix: 'Time spent',
    correct: 'Correct',
    wrong: 'Incorrect',
    givenAnswer: 'Their answer: ',
    correctAnswer: 'Correct answer: ',
    durationMinutes: '{m} min {s} s',
    durationSeconds: '{s} s'
  },
  api: {
    errors: {
      AUTH_REQUIRED: 'Please log in first.',
      VALIDATION_ERROR: 'Some submitted content is incomplete. Please check and retry.',
      USERNAME_TAKEN: 'That username is already taken.',
      INVALID_CREDENTIALS: 'Incorrect username or password.',
      NOT_FOUND: 'Not found — it may have been deleted.',
      FORBIDDEN: 'You do not have permission to do that.',
      ACTIVITY_NOT_OPEN: 'This activity has ended or is not open yet.',
      INTERNAL_ERROR: 'Something went wrong on our side. Please try again later.'
    }
  }
}

export const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
} as const

export type SupportedLocale = keyof typeof messages

type DotPaths<T> = T extends string
  ? never
  : { [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}` }[keyof T & string]

/** 所有可能的文案 key（点路径），如 `bank.share.copyLink` */
export type MessageKey = DotPaths<MessageSchema>

export type ApiErrorCode = keyof MessageSchema['api']['errors']

export type InterpolationParams = Record<string, string | number>
