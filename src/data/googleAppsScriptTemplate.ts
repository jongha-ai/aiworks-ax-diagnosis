/**
 * Google Apps Script 템플릿 코드
 * 
 * 구글 스프레드시트 > 확장 프로그램 > Apps Script에 붙여넣고 배포하면,
 * 진단 완료 시 구글 시트에 자동 기록 + 구글 드라이브 폴더에 영구 파일 저장 + 이메일 자동 전송이 원스톱으로 이루어집니다.
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * [AIWORKS] 기업 AX 간이진단 결과 -> 구글 시트 & 구글 드라이브 & 이메일 자동 연동 스크립트
 * 
 * [배포 방법]
 * 1. 구글 스프레드시트 생성 후 [확장 프로그램] > [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 스크립트 전체를 붙여넣기
 * 3. 우측 상단 [배포] > [새 배포] 클릭
 * 4. 유형 선택: [웹 앱]
 * 5. 다음 사용자 권한으로 실행: [나]
 * 6. 액세스 권한: [모든 사용자 (Anyone)] 선택 후 [배포] 클릭
 * 7. 생성된 [웹 앱 URL]을 AIWORKS 진단 시스템의 '구글 시트 연동 설정'에 입력하면 완료!
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    // 1. 구글 스프레드시트 기록
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // 시트가 비어있다면 헤더 자동 생성
    if (sheet.getLastRow() === 0) {
      var headers = [
        "진단일시", "회사명", "평가자", "직책/역할", "이메일", "직원수", "AI활용수준",
        "성숙도레벨", "레벨명", "종합점수", "원점수(75점만점)",
        "AI활용점수", "업무프로세스점수", "지식관리점수", "자동화점수", "보안검증점수",
        "최고강점영역", "최대병목영역",
        "1순위과제", "2순위과제", "3순위과제",
        "Q19_줄이고싶은반복업무", "Q20_우선개선업무", "감지된위험신호",
        "컨설턴트_병목단계", "컨설턴트_담당자", "컨설턴트_대체여부", "컨설턴트_애로사항", "컨설턴트_기대효과",
        "드라이브백업파일ID"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setBackground("#1E293B").setFontColor("#FFFFFF").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    // 2. 구글 드라이브 "AIWORKS_AX_진단결과" 폴더에 영구 백업 파일 저장
    var driveFileId = "";
    try {
      var folderName = "AIWORKS_AX_진단결과";
      var folders = DriveApp.getFoldersByName(folderName);
      var folder;
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }

      var sanitizedComp = (data.companyName || "미지정").replace(/[/\\\\?%*:|"<>]/g, "_");
      var fileName = "[AX진단]_" + sanitizedComp + "_" + Utilities.formatDate(new Date(), "GMT+9", "yyyyMMdd_HHmmss") + ".txt";
      var fileContent = data.textSummary || JSON.stringify(data, null, 2);
      
      var createdFile = folder.createFile(fileName, fileContent, MimeType.PLAIN_TEXT);
      driveFileId = createdFile.getId();
    } catch (driveErr) {
      Logger.log("Drive save warning: " + driveErr.toString());
    }

    // 3. 스프레드시트에 새 행 추가
    var interview = data.consultantInterview || {};
    var newRow = [
      data.timestamp || Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss"),
      data.companyName || "",
      data.evaluatorName || "",
      data.evaluatorRole || "",
      data.targetEmail || "",
      data.employeeCount || "",
      data.currentAiUsage || "",
      data.levelNumber || "",
      data.levelTitle || "",
      data.totalScore || 0,
      data.totalRawScore || 0,
      data.score_aiUsage || 0,
      data.score_workProcess || 0,
      data.score_knowledge || 0,
      data.score_automation || 0,
      data.score_security || 0,
      data.strongestDomain || "",
      data.bottleneckDomain || "",
      data.task1_title || "",
      data.task2_title || "",
      data.task3_title || "",
      data.q19_timeWaster || "",
      data.q20_topPriority || "",
      data.triggeredRisks || "",
      interview.q1_timeConsumingPart || "",
      interview.q2_currentOperator || "",
      interview.q3_substituteFeasible || "",
      interview.q4_aiFrustration || "",
      (interview.q5_expectedEffects || []).join(", "),
      driveFileId
    ];

    sheet.appendRow(newRow);

    // 4. 이메일 자동 발송 (targetEmail이 입력된 경우)
    if (data.targetEmail && data.targetEmail.indexOf("@") !== -1) {
      try {
        var subject = "[AIWORKS] " + (data.companyName || "귀사") + " AX(인공지능 전환) 간이진단 결과 리포트";
        var body = data.textSummary || "진단이 성공적으로 완료되었습니다.";
        MailApp.sendEmail(data.targetEmail, subject, body);
      } catch (mailErr) {
        Logger.log("Mail send warning: " + mailErr.toString());
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data saved to Google Sheet & Drive successfully",
      row: sheet.getLastRow(),
      driveFileId: driveFileId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
