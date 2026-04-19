import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files content can be moved to separate JSON files later
const resources = {
  en: {
    translation: {
      "app": {
        "title": "A-Tracker",
        "search": "Global search...",
      },
      "sidebar": {
        "dashboard": "Dashboard",
        "students": "Students",
        "applications": "U-App",
        "rankings": "QS Rankings",
        "statistics": "Statistics",
        "settings": "Settings"
      },
      "stats": {
        "title": "Data Statistics",
        "tabs": {
            "academic": "Academic performance",
            "milestones": "Achievement Milestones",
            "university": "University Admissions",
            "demographics": "Demographics"
        },
        "academic": {
            "igcse": "IGCSE Results by Year",
            "ias": "IAS Results by Year",
            "ial": "IAL/GCEAL Results by Year",
            "ielts": "IELTS Band Distribution"
        },
        "milestones": {
            "igcse": "IGCSE A* Distribution",
            "ias": "IAS A* Distribution",
            "ial": "IAL/GCEAL A* Distribution"
        },
        "university": {
            "enrollment": "University Enrollment Summary",
            "geographic": "Geographic Distribution"
        },
        "demographics": {
            "cohort": "Cohort Snapshot",
            "gender": "Gender breakdown"
        },
        "fields": {
            "year": "Year of Grad",
            "program": "Program Name",
            "university": "University",
            "name": "Name of Graduate",
            "title": "Graduates in {{field}}"
        }
      },
      "dashboard": {
        "currentStudent": "Current Student",
        "graduated": "Graduated",
        "total": "Total",
      },
      "student": {
        "status": "Status",
        "year": "Year",
        "name": "Name",
        "igcse": "IGCSE",
        "ias": "IAS",
        "alevel": "IAS/GCEAL",
        "ielts": "IELTS",
        "university": "University",
        "program": "Program",
        "actions": "Actions",
        "add": "Add New",
        "export": "TEMPLATE",
        "import": "BATCH IMPORT"
      }
    }
  },
  zh: {
    translation: {
      "app": {
        "title": "A-Tracker 追蹤系統",
        "search": "全域搜尋...",
      },
      "sidebar": {
        "dashboard": "儀表板",
        "students": "學生資訊",
        "applications": "申請管理",
        "rankings": "QS排名",
        "statistics": "數據統計",
        "settings": "設定"
      },
      "stats": {
        "title": "數據統計",
        "tabs": {
            "academic": "學術表現",
            "milestones": "成績分佈",
            "university": "大學升學",
            "demographics": "人口統計"
        },
        "academic": {
            "igcse": "IGCSE 歷年成績",
            "ias": "IAS 歷年成績",
            "ial": "IAL/GCEAL 歷年成績",
            "ielts": "IELTS 分數分佈"
        },
        "milestones": {
            "igcse": "IGCSE A* 統計",
            "ias": "IAS A* 統計",
            "ial": "IAL/GCEAL A* 統計"
        },
        "university": {
            "enrollment": "大學錄取概況",
            "geographic": "地理分佈"
        },
        "demographics": {
            "cohort": "年度快照",
            "gender": "性別比例"
        },
        "fields": {
            "year": "課程屆次",
            "program": "課程名稱",
            "university": "升學大學",
            "name": "學生姓名",
            "title": "{{field}} 畢業生名單"
        }
      },
      "dashboard": {
        "currentStudent": "在校生",
        "graduated": "已畢業",
        "total": "總人數",
      },
      "student": {
        "status": "狀態",
        "year": "年份",
        "name": "姓名",
        "igcse": "IGCSE",
        "ias": "IAS",
        "alevel": "IAS/GCEAL",
        "ielts": "IELTS",
        "university": "大學",
        "program": "科系",
        "actions": "操作",
        "add": "新增",
        "export": "下載模板",
        "import": "批量導入"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
