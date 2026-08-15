import { Module } from "@nestjs/common";
import { OrgMemberRepository } from "./org-member.repository";
import { OrgMemberService } from "./org-member.service";
import { OrgMemberController } from "./org-member.controller";

@Module({
    controllers: [OrgMemberController],
    providers: [OrgMemberService, OrgMemberRepository],
    exports: [OrgMemberService]
})
export class OrgMemberModule{}