let loadError: any = null;
let appInstance: any;

try {
  require('../apps/api/src/config/env');
  const prisma = require('../apps/api/src/config/database').default;
  appInstance = require('../apps/api/src/app').default;
  prisma.$connect().catch((err: any) => console.error("Prisma connect error", err));
} catch (err: any) {
  console.error("FATAL BOOT ERROR", err);
  loadError = err;
}

export default function handler(req: any, res: any) {
  if (loadError) {
    return res.status(500).json({ 
      error: "Fatal Boot Error", 
      message: loadError.message, 
      stack: loadError.stack 
    });
  }
  return appInstance(req, res);
}
