require('dotenv').config({ path: './.env.dev' });

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const route = require('./route/index.js');
const dbConnect = require('./database/index.js');
const { errorHandler } = require('./util/errorHandler.js');
const timeout = require('connect-timeout');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const fs = require('fs');
const { STATUS_MESSAGE } = require('./util/constant/httpStatusCode');

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

//  CORS 설정 (모든 origin 허용)
app.use(cors('*'));

//  정적 파일 제공 (프로필 이미지 등)
app.use('/public', express.static('public'));

//  JSON 및 Form 데이터 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//  세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24, // 1일
    },
  })
);

//  요청 속도 제한
const limiter = rateLimit({
  windowMs: 10 * 1000, // 10초 동안
  max: 100, // 최대 100건 허용
  message: STATUS_MESSAGE.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

//  요청 타임아웃
app.use(timeout('5s'));

//  보안 헤더 설정
app.use(helmet());

//  라우터 등록 (라우터 파일에서 prefix 처리함)
app.use('/', route);

//  에러 핸들러 등록 (항상 마지막에 위치)
app.use(errorHandler);

//  세션 초기화 함수
const initSessionId = async () => {
  try {
    const sql = 'UPDATE user_table SET session_id = NULL;';
    await dbConnect.query(sql);
    startHttpServer();
  } catch (error) {
    console.error('Failed to initialize session IDs:', error);
    process.exit(1); // 실패 시 종료
  }
};

//  서버 시작 함수
const startHttpServer = () => {
  app.listen(PORT, () => {
    console.log(`edu-community app listening at http://localhost:${PORT}`);
  });
};

//  초기화 및 서버 시작
initSessionId();