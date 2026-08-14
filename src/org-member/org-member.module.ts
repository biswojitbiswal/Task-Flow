import { Module } from "@nestjs/common";
import { OrgMemberRepository } from "./org-member.repository";
import { OrgMemberService } from "./org-member.service";

@Module({
    providers: [OrgMemberService, OrgMemberRepository],
    exports: [OrgMemberService]
})
export class OrgMemberModule{}