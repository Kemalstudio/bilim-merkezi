-- AlterTable
ALTER TABLE "phone_otps" ADD COLUMN     "gatewayOtpId" TEXT,
ALTER COLUMN "codeHash" DROP NOT NULL;
