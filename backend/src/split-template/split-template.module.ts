import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SplitTemplate } from "./entities/split-template.entity";
import { SplitTemplateService } from "./split-template.service";
import { SplitTemplateController } from "./split-template.controller";

@Module({
    imports: [TypeOrmModule.forFeature([SplitTemplate])],
    controllers: [SplitTemplateController],
    providers: [SplitTemplateService],
    exports: [SplitTemplateService],
})
export class SplitTemplateModule {}
