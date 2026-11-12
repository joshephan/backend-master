import { Test, TestingModule } from '@nestjs/testing';
import { NotifierController } from './notifier.controller.js';
import { NotifierService } from './notifier.service.js';

describe('NotifierController', () => {
  let notifierController: NotifierController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotifierController],
      providers: [NotifierService],
    }).compile();

    notifierController = app.get<NotifierController>(NotifierController);
  });

  describe('root', () => {
    it('첫 화면 문구에 좌석 표기가 들어간다', () => {
      expect(notifierController.getHello()).toBe('알림: A구역 3열 15번 예매 확정');
    });
  });
});
