import React from 'react';
import {
  Layers,
  Building2,
  Network,
  Landmark,
  Boxes,
  Briefcase,
  FolderTree,
  ShieldCheck,
  Compass,
  Sparkles,
  LayoutGrid,
  Cpu,
  Check,
  X,
  Palette,
  Eye,
} from 'lucide-react';

export type OrgIconType =
  | 'layers'
  | 'building'
  | 'network'
  | 'landmark'
  | 'boxes'
  | 'briefcase'
  | 'foldertree'
  | 'shield'
  | 'compass'
  | 'sparkles'
  | 'grid'
  | 'cpu';

export interface OrgIconOption {
  id: OrgIconType;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  iconBg: string;
  iconColor: string;
  IconComponent: React.ComponentType<{ className?: string }>;
  description: string;
}

export const ORG_ICON_OPTIONS: OrgIconOption[] = [
  {
    id: 'layers',
    title: '모던 레이어 (Layers)',
    subtitle: '계층적 본부 및 부문 구조',
    tag: '현재 기본 추천',
    tagColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    iconBg: 'bg-indigo-50 border-indigo-200',
    iconColor: 'text-indigo-600',
    IconComponent: Layers,
    description: '3단 레이어로 본부-실-팀으로 이어지는 조직 계층 구조를 가장 현대적이고 깔끔하게 표현합니다.',
  },
  {
    id: 'building',
    title: '클래식 본사 빌딩 (Building2)',
    subtitle: '전통적인 본사 및 거점 사옥',
    tag: '정통 기업형',
    tagColor: 'bg-blue-100 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    IconComponent: Building2,
    description: '사옥과 빌딩 형태로 누구나 한눈에 직관적으로 회사의 본부 및 사업 거점임을 알아볼 수 있습니다.',
  },
  {
    id: 'network',
    title: '연결 네트워크 (Network)',
    subtitle: '부서 간 유기적 협업망',
    tag: '스마트 협업형',
    tagColor: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    iconBg: 'bg-cyan-50 border-cyan-200',
    iconColor: 'text-cyan-600',
    IconComponent: Network,
    description: '노드와 링크가 연결된 허브 디자인으로 전사 조직 간 유기적인 데이터 및 포인트 흐름을 표현합니다.',
  },
  {
    id: 'landmark',
    title: '신뢰의 본부 (Landmark)',
    subtitle: '경영 총괄 및 핵심 거점',
    tag: '중후함 / 신뢰감',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-200',
    iconBg: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-700',
    IconComponent: Landmark,
    description: '고전 기둥과 신전 형태의 랜드마크로 경영총괄 및 기획본부의 묵직한 신뢰감을 전달합니다.',
  },
  {
    id: 'boxes',
    title: '사업부 모듈 큐브 (Boxes)',
    subtitle: '비즈니스 유닛(BU) 블록',
    tag: '모듈형 사업부',
    tagColor: 'bg-purple-100 text-purple-700 border-purple-200',
    iconBg: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-600',
    IconComponent: Boxes,
    description: '입체 큐브 박스가 모인 형태로 각 독립 사업부와 부문별 예산 단위를 직관적으로 구분합니다.',
  },
  {
    id: 'foldertree',
    title: '조직도 트리 (FolderTree)',
    subtitle: '체계적인 인사/부서 디렉토리',
    tag: '인사/조직도형',
    tagColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
    IconComponent: FolderTree,
    description: '폴더 트리 구조로 사내 인사 DB 및 조직 체계도를 전문 관리하는 시스템 느낌을 줍니다.',
  },
  {
    id: 'briefcase',
    title: '비즈니스 포트폴리오 (Briefcase)',
    subtitle: '전문 업무 및 실무 조직',
    tag: '전문 비즈니스',
    tagColor: 'bg-slate-100 text-slate-700 border-slate-200',
    iconBg: 'bg-slate-100 border-slate-300',
    iconColor: 'text-slate-700',
    IconComponent: Briefcase,
    description: '서류 가방 형태로 실무 비즈니스와 전문 프로젝트 단위 조직을 표현하기에 적합합니다.',
  },
  {
    id: 'grid',
    title: '모듈 그리드 (LayoutGrid)',
    subtitle: '다각화된 사업 부문 매트릭스',
    tag: '플랫폼 / SaaS형',
    tagColor: 'bg-violet-100 text-violet-700 border-violet-200',
    iconBg: 'bg-violet-50 border-violet-200',
    iconColor: 'text-violet-600',
    IconComponent: LayoutGrid,
    description: '정방형 4분할 그리드로 플랫폼 기업의 다각화된 사업 영역과 부서를 세련되게 나타냅니다.',
  },
  {
    id: 'cpu',
    title: '기술 혁신 허브 (Cpu)',
    subtitle: 'R&D 및 DT 플랫폼 부문',
    tag: '테크 / 미래기술',
    tagColor: 'bg-sky-100 text-sky-700 border-sky-200',
    iconBg: 'bg-sky-50 border-sky-200',
    iconColor: 'text-sky-600',
    IconComponent: Cpu,
    description: '마이크로 프로세서 형태로 AI, R&D 연구소, DT 디지털 혁신 조직에 특화된 분위기입니다.',
  },
  {
    id: 'compass',
    title: '전략 나침반 (Compass)',
    subtitle: '미래 방향 및 전략 기획',
    tag: '전략 / 리더십',
    tagColor: 'bg-rose-100 text-rose-700 border-rose-200',
    iconBg: 'bg-rose-50 border-rose-200',
    iconColor: 'text-rose-600',
    IconComponent: Compass,
    description: '나침반 형상으로 회사의 전략적 방향을 이끄는 본부 및 기획 부서의 정체성을 강조합니다.',
  },
  {
    id: 'shield',
    title: '신뢰 엠블럼 (ShieldCheck)',
    subtitle: '컴플라이언스 & 거버넌스',
    tag: '거버넌스 / 관리',
    tagColor: 'bg-teal-100 text-teal-700 border-teal-200',
    iconBg: 'bg-teal-50 border-teal-200',
    iconColor: 'text-teal-600',
    IconComponent: ShieldCheck,
    description: '체크 쉴드 형태로 예산 승인, 내부 통제, 총무/인사 거버넌스 부서의 안정감을 줍니다.',
  },
  {
    id: 'sparkles',
    title: '핵심 성장 부문 (Sparkles)',
    subtitle: '미래 성장 & 우수 조직',
    tag: '프리미엄 / 하이라이트',
    tagColor: 'bg-amber-100 text-amber-700 border-amber-200',
    iconBg: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-500',
    IconComponent: Sparkles,
    description: '반짝이는 별빛 형태로 회사의 핵심 리워드 부서 및 미래 성장 동력 조직을 돋보이게 합니다.',
  },
];

export function getOrgIconComponent(type: OrgIconType): React.ComponentType<{ className?: string }> {
  const match = ORG_ICON_OPTIONS.find(opt => opt.id === type);
  return match ? match.IconComponent : Layers;
}

interface IconGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIcon: OrgIconType;
  onSelectIcon: (iconType: OrgIconType) => void;
}

export const IconGalleryModal: React.FC<IconGalleryModalProps> = ({
  isOpen,
  onClose,
  selectedIcon,
  onSelectIcon,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-linear-to-r from-slate-50 to-indigo-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                조직 아이콘 디자인 갤러리
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  12가지 디자인 옵션
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                마음에 드는 아이콘 디자인을 클릭하면 상단 메트릭 카드와 테이블 목록에 즉시 실시간 적용됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Table Row Preview Banner */}
        <div className="px-6 py-3.5 bg-slate-100/80 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>현재 테이블 적용 미리보기:</span>
          </div>
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
            {/* Example 1 */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">조직 1:</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                {React.createElement(getOrgIconComponent(selectedIcon), {
                  className: 'w-4 h-4 text-indigo-600 shrink-0',
                })}
                <span>전략기획본부</span>
              </div>
            </div>
            <span className="text-slate-300">|</span>
            {/* Example 2 */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">조직 2:</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                {React.createElement(getOrgIconComponent(selectedIcon), {
                  className: 'w-4 h-4 text-indigo-600 shrink-0',
                })}
                <span>미래기술R&D센터</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Cards Grid */}
        <div className="p-6 max-h-[65vh] overflow-y-auto bg-slate-50/40">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ORG_ICON_OPTIONS.map(option => {
              const isSelected = selectedIcon === option.id;
              const IconComp = option.IconComponent;

              return (
                <div
                  key={option.id}
                  onClick={() => onSelectIcon(option.id)}
                  className={`relative group rounded-2xl p-4.5 border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20 shadow-indigo-100'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  {/* Top row: Icon Graphic + Tag */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {/* Big Icon Showcase Container */}
                      <div
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${option.iconBg}`}
                      >
                        <IconComp className={`w-6 h-6 ${option.iconColor}`} />
                      </div>

                      {/* Tag & Selection Indicator */}
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${option.tagColor}`}
                        >
                          {option.tag}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            <Check className="w-3.5 h-3.5" /> 선택됨
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <h4 className="text-sm font-bold text-slate-900 mb-0.5 flex items-center gap-1.5">
                      {option.title}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 mb-2.5">
                      {option.subtitle}
                    </p>

                    {/* Description */}
                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                      {option.description}
                    </p>
                  </div>

                  {/* Bottom: Table Simulation preview */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                      <IconComp className={`w-3.5 h-3.5 ${option.iconColor}`} />
                      <span>경영지원본부</span>
                    </div>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onSelectIcon(option.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600'
                      }`}
                    >
                      {isSelected ? '적용 중' : '선택'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>선택 즉시 메트릭 카드와 회원 목록 테이블에 실시간 반영됩니다.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
