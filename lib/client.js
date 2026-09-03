window.__ModuleLoader__.load({
	id: "dsh-model-scheduler",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_dom = require("react-dom");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/locales.ts
		/**
		* Locale dictionaries for the model-scheduler browser face.
		* zh is the key source; en is checked complete against it.
		*/
		const NS = "model.scheduler";
		/** Simplified Chinese dictionary (key source of truth). */
		const zh = {
			"button.aria": "模型时段调度，当前{period}",
			"button.tooltip": "打开模型调度面板",
			"period.peak": "高峰",
			"period.offpeak": "空闲",
			"period.active": "当前时段：{period}",
			"status.effective": "当前生效模型：{model}",
			"status.unconfigured": "尚未配置高峰/空闲模型",
			"status.lastSwitch": "上次自动切换：{time}",
			"status.disabled": "自动切换已关闭",
			"action.applyNow": "立即切换到当前时段模型",
			"action.back": "返回",
			"panel.title": "模型时段调度",
			"config.enabled": "启用时段自动切换",
			"config.on": "开",
			"config.off": "关",
			"config.peakModel": "高峰模型",
			"config.offpeakModel": "空闲模型",
			"config.peakWindows": "高峰时段（时区 {timeZone}）",
			"config.peakDays": "高峰日",
			"config.windowN": "时段 {n}",
			"config.windowStart": "开始",
			"config.windowEnd": "结束",
			"config.route": "{provider} / {model}",
			"config.pick": "点击选择模型",
			"weekday.sun": "日",
			"weekday.mon": "一",
			"weekday.tue": "二",
			"weekday.wed": "三",
			"weekday.thu": "四",
			"weekday.fri": "五",
			"weekday.sat": "六",
			"search.title": "搜索并选择模型",
			"search.placeholder": "输入模型名称或 ID 过滤…",
			"search.hint": "点击「立即使用」切换本会话；也可设为高峰或空闲模型",
			"search.empty": "没有匹配的模型",
			"search.use": "立即使用",
			"search.setPeak": "设为高峰模型",
			"search.setOffpeak": "设为空闲模型",
			"search.current": "当前",
			"notice.saved": "已保存，切换将自动生效",
			"notice.error": "操作失败：{message}",
			"notice.loading": "正在加载模型…",
			"panel.close": "关闭"
		};
		/** English dictionary, complete against the zh keys. */
		const en = {
			"button.aria": "Model schedule, currently {period}",
			"button.tooltip": "Open model schedule panel",
			"period.peak": "peak",
			"period.offpeak": "off-peak",
			"period.active": "Current period: {period}",
			"status.effective": "Effective model: {model}",
			"status.unconfigured": "Peak/off-peak models not configured yet",
			"status.lastSwitch": "Last automatic switch: {time}",
			"status.disabled": "Automatic switching is off",
			"action.applyNow": "Switch to the current period model now",
			"action.back": "Back",
			"panel.title": "Model schedule",
			"config.enabled": "Enable period-based automatic switching",
			"config.on": "On",
			"config.off": "Off",
			"config.peakModel": "Peak model",
			"config.offpeakModel": "Off-peak model",
			"config.peakWindows": "Peak windows (time zone {timeZone})",
			"config.peakDays": "Peak days",
			"config.windowN": "Window {n}",
			"config.windowStart": "Start",
			"config.windowEnd": "End",
			"config.route": "{provider} / {model}",
			"config.pick": "Click to pick a model",
			"weekday.sun": "Sun",
			"weekday.mon": "Mon",
			"weekday.tue": "Tue",
			"weekday.wed": "Wed",
			"weekday.thu": "Thu",
			"weekday.fri": "Fri",
			"weekday.sat": "Sat",
			"search.title": "Search and select a model",
			"search.placeholder": "Filter by model name or ID…",
			"search.hint": "Click \"Use now\" to switch this conversation; or assign as peak/off-peak model",
			"search.empty": "No matching models",
			"search.use": "Use now",
			"search.setPeak": "Set as peak model",
			"search.setOffpeak": "Set as off-peak model",
			"search.current": "Current",
			"notice.saved": "Saved — switching applies automatically",
			"notice.error": "Operation failed: {message}",
			"notice.loading": "Loading models…",
			"panel.close": "Close"
		};
		//#endregion
		//#region src/client/ModelSearchList.tsx
		/**
		* Searchable model list: filters the shared catalog by query and renders one
		* model row per match, grouped by provider. Rows expose the caller's action
		* buttons (use-now / assign-to-period).
		*/
		/** Filter the catalog by a lowercase includes match over name, id, and group name. */
		function filterCatalog(groups, query) {
			const needle = query.trim().toLowerCase();
			if (needle === "") return groups.flatMap((group) => group.models.map((model) => ({
				group,
				model
			})));
			const rows = [];
			for (const group of groups) for (const model of group.models) if (model.name.toLowerCase().includes(needle) || model.id.toLowerCase().includes(needle) || group.name.toLowerCase().includes(needle)) rows.push({
				group,
				model
			});
			return rows;
		}
		/** Render filtered model rows grouped by provider. */
		function ModelSearchList({ groups, query, current, actions, t }) {
			const rows = (0, react.useMemo)(() => filterCatalog(groups, query), [groups, query]);
			if (rows.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "msd-empty",
				children: t("search.empty")
			});
			const rendered = [];
			let lastGroup = null;
			for (const row of rows) {
				if (row.group.id !== lastGroup) {
					lastGroup = row.group.id;
					rendered.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "msd-groupTitle",
						children: row.group.name
					}, `g:${row.group.id}`));
				}
				const active = current !== null && current.provider === row.group.id && current.model === row.model.id;
				rendered.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "msd-model",
					role: "option",
					"aria-selected": active,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "msd-modelName",
							children: row.model.name
						}),
						row.model.description !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "msd-modelDesc",
							children: row.model.description
						}) : null,
						active ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "msd-modelTag",
							children: t("search.current")
						}) : null,
						actions.map((action) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: action.primary === true ? "msd-primary" : "msd-pick",
							onClick: () => {
								action.onPick(row);
							},
							children: action.label
						}, action.key))
					]
				}, `${row.group.id}/${row.model.id}`));
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "msd-list",
				role: "listbox",
				children: rendered
			});
		}
		//#endregion
		//#region src/client/period.ts
		/**
		* Peak/off-peak period engine (browser half).
		* Mirrors `lib/period.js`; keep the two implementations in sync. Both sides
		* evaluate the same configured schedule so the panel preview matches the host
		* switch without extra wiring.
		*/
		/** 'HH:mm' → minutes since midnight; NaN for malformed input. */
		function parseClock(value) {
			const match = /^(\d{1,2}):(\d{2})$/.exec(value);
			if (match === null) return NaN;
			const hours = Number(match[1]);
			const minutes = Number(match[2]);
			if (hours > 23 || minutes > 59) return NaN;
			return hours * 60 + minutes;
		}
		/** Whether one instant falls inside a window. */
		function windowContains(window, minute) {
			const start = parseClock(window.start);
			const end = parseClock(window.end);
			if (Number.isNaN(start) || Number.isNaN(end)) return false;
			if (start === end) return false;
			if (start < end) return minute >= start && minute < end;
			return minute >= start || minute < end;
		}
		/** Weekday face (0=Sunday … 6=Saturday) for one instant in a time zone. */
		function timeFace(date, timeZone) {
			if (timeZone !== void 0 && timeZone !== "") try {
				const parts = new Intl.DateTimeFormat("en-US", {
					timeZone,
					weekday: "short",
					hour: "2-digit",
					minute: "2-digit",
					hour12: false
				}).formatToParts(date);
				const get = (type) => parts.find((part) => part.type === type)?.value;
				const weekday = get("weekday");
				const hour = Number(get("hour"));
				const minute = Number(get("minute"));
				const weeks = {
					Sun: 0,
					Mon: 1,
					Tue: 2,
					Wed: 3,
					Thu: 4,
					Fri: 5,
					Sat: 6
				};
				if (weekday !== void 0 && Number.isFinite(hour) && Number.isFinite(minute)) return {
					day: weeks[weekday],
					minute: hour * 60 + minute
				};
			} catch {}
			return {
				day: date.getDay(),
				minute: date.getHours() * 60 + date.getMinutes()
			};
		}
		/** Current period for one instant under a schedule section. */
		function periodAt(date, settings) {
			const face = timeFace(date, settings.timeZone);
			if (face === null) return "off-peak";
			if (!(settings.peakDays ?? [
				1,
				2,
				3,
				4,
				5
			]).includes(face.day)) return "off-peak";
			const windows = settings.peakWindows ?? [];
			for (const window of windows) if (windowContains(window, face.minute)) return "peak";
			return "off-peak";
		}
		/** The model route active for one instant, or undefined when unconfigured. */
		function activeRoute(settings, period) {
			const route = period === "peak" ? settings.peakModel : settings.offPeakModel;
			if (route?.provider === void 0 || route?.provider === "" || route?.model === void 0 || route?.model === "") return;
			return route;
		}
		//#endregion
		//#region src/client/ModelSchedulerPanel.tsx
		/**
		* Schedule panel: current period + effective model, the peak/off-peak
		* configuration (models, windows, days, enable switch), and a searchable
		* model picker that assigns a model or uses it for the current session.
		*/
		const WEEKDAYS = [
			{
				id: 0,
				key: "weekday.sun"
			},
			{
				id: 1,
				key: "weekday.mon"
			},
			{
				id: 2,
				key: "weekday.tue"
			},
			{
				id: 3,
				key: "weekday.wed"
			},
			{
				id: 4,
				key: "weekday.thu"
			},
			{
				id: 5,
				key: "weekday.fri"
			},
			{
				id: 6,
				key: "weekday.sat"
			}
		];
		const EMPTY_CONFIG = {};
		/** Render the schedule panel content. */
		function ModelSchedulerPanel({ injected, t, onClose }) {
			const config = (0, react.useSyncExternalStore)(injected.scope.subscribe, injected.scope.getSnapshot).value ?? EMPTY_CONFIG;
			const [now, setNow] = (0, react.useState)(() => /* @__PURE__ */ new Date());
			const [view, setView] = (0, react.useState)("main");
			const [target, setTarget] = (0, react.useState)("use");
			const [query, setQuery] = (0, react.useState)("");
			const [catalog, setCatalog] = (0, react.useState)({
				status: "idle",
				value: null,
				error: null
			});
			const [busy, setBusy] = (0, react.useState)(false);
			const [notice, setNotice] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				const timer = setInterval(() => {
					setNow(/* @__PURE__ */ new Date());
				}, 1e3);
				return () => {
					clearInterval(timer);
				};
			}, []);
			(0, react.useEffect)(() => {
				injected.loadCatalog().then((value) => {
					setCatalog({
						status: "ready",
						value,
						error: null
					});
				}, (error) => {
					setCatalog({
						status: "error",
						value: null,
						error: error instanceof Error ? error.message : String(error)
					});
				});
			}, [injected]);
			const period = periodAt(now, config);
			const effective = activeRoute(config, period);
			const periodLabel = period === "peak" ? t("period.peak") : t("period.offpeak");
			/** Write one settings field, surfacing the outcome on the shared notice. */
			const setField = (field, value) => {
				setBusy(true);
				injected.scope.set(String(field), value).then(() => {
					setBusy(false);
					setNotice({
						kind: "saved",
						text: t("notice.saved")
					});
				}, (error) => {
					setBusy(false);
					setNotice({
						kind: "error",
						text: t("notice.error", { message: error instanceof Error ? error.message : String(error) })
					});
				});
			};
			const openSearch = (next) => {
				setTarget(next);
				setQuery("");
				setView("search");
			};
			const routeOf = (row) => ({
				provider: row.group.id,
				model: row.model.id,
				...row.model.reasoning?.defaultEffort === void 0 ? {} : { reasoningEffort: row.model.reasoning.defaultEffort }
			});
			const useNow = (row) => {
				setBusy(true);
				injected.selectModel(routeOf(row)).then(() => {
					setBusy(false);
					setNotice({
						kind: "saved",
						text: t("notice.saved")
					});
					setView("main");
				}, (error) => {
					setBusy(false);
					setNotice({
						kind: "error",
						text: t("notice.error", { message: error instanceof Error ? error.message : String(error) })
					});
				});
			};
			const assign = (row) => {
				setField(target === "peak" ? "peakModel" : "offPeakModel", routeOf(row));
				setView("main");
			};
			const actions = target === "use" ? [{
				key: "use",
				label: t("search.use"),
				primary: true,
				onPick: useNow
			}] : [{
				key: "assign",
				label: target === "peak" ? t("search.setPeak") : t("search.setOffpeak"),
				primary: true,
				onPick: assign
			}, {
				key: "use",
				label: t("search.use"),
				onPick: useNow
			}];
			/** Route label for one configured slot ('provider / model'), or a pick hint when empty. */
			const routeLabel = (route) => route?.provider === void 0 || route?.provider === "" || route?.model === void 0 || route?.model === "" ? t("config.pick") : t("config.route", {
				provider: route.provider,
				model: route.model
			});
			const windows = config.peakWindows ?? [];
			const days = config.peakDays ?? [];
			if (view === "search") {
				const groups = catalog.value?.groups ?? [];
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "msd-panelHead",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "msd-close",
							onClick: () => {
								setView("main");
							},
							children: t("action.back")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "msd-panelTitle",
							children: t("search.title")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "msd-close",
							"aria-label": t("panel.close"),
							onClick: onClose,
							children: "✕"
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "msd-searchRoot",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "text",
							className: "msd-search",
							placeholder: t("search.placeholder"),
							value: query,
							onChange: (event) => {
								setQuery(event.target.value);
							},
							autoFocus: true
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "msd-hint",
							children: t("search.hint")
						}),
						catalog.status === "loading" || catalog.status === "idle" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "msd-loading",
							children: t("notice.loading")
						}) : catalog.status === "error" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "msd-fail",
							children: t("notice.error", { message: catalog.error ?? "catalog" })
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelSearchList, {
							groups,
							query,
							current: catalog.value?.default ?? null,
							actions,
							t
						})
					]
				})] });
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "msd-panelHead",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "msd-panelTitle",
						children: t("panel.title")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "msd-close",
						"aria-label": t("panel.close"),
						onClick: onClose,
						children: "✕"
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "msd-status",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "msd-statusRow",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: period === "peak" ? "msd-badge msd-badge-peak" : "msd-badge msd-badge-offpeak" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("period.active", { period: periodLabel }) })]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "msd-statusRow",
						children: effective !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("status.effective", { model: routeLabelFrom(effective, t) }) }) : config.enabled === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "msd-statusDim",
							children: t("status.unconfigured")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "msd-statusDim",
							children: t("status.disabled")
						})
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "msd-section",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "msd-sectionTitle",
						children: t("config.enabled")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: "msd-switchRow",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: config.enabled === true,
							disabled: busy,
							onChange: (event) => {
								setField("enabled", event.target.checked);
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "msd-switchLabel",
							children: config.enabled === true ? t("config.on") : t("config.off")
						})]
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "msd-section",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "msd-sectionTitle",
							children: t("config.peakModel")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "msd-row",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "msd-rowLabel",
								children: t("period.peak")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "msd-pick",
								onClick: () => {
									openSearch("peak");
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "msd-pickText",
									children: routeLabel(config.peakModel)
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "msd-pickChevron",
									children: "▾"
								})]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "msd-row",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "msd-rowLabel",
								children: t("period.offpeak")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "msd-pick",
								onClick: () => {
									openSearch("off-peak");
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "msd-pickText",
									children: routeLabel(config.offPeakModel)
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "msd-pickChevron",
									children: "▾"
								})]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "msd-section",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "msd-sectionTitle",
						children: t("config.peakWindows", { timeZone: config.timeZone ?? "" })
					}), [0, 1].map((index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "msd-windowRow",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "msd-windowLabel",
								children: t("config.windowN", { n: index + 1 })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "time",
								className: "msd-time",
								"aria-label": t("config.windowStart"),
								value: windows[index]?.start ?? "09:00",
								onChange: (event) => {
									const next = windows.map((window) => ({ ...window }));
									next[index] = {
										start: event.target.value || "",
										end: windows[index]?.end ?? ""
									};
									setField("peakWindows", next);
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "–" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "time",
								className: "msd-time",
								"aria-label": t("config.windowEnd"),
								value: windows[index]?.end ?? "12:00",
								onChange: (event) => {
									const next = windows.map((window) => ({ ...window }));
									next[index] = {
										start: windows[index]?.start ?? "",
										end: event.target.value || ""
									};
									setField("peakWindows", next);
								}
							})
						]
					}, index))]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "msd-section",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "msd-sectionTitle",
						children: t("config.peakDays")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "msd-days",
						children: WEEKDAYS.map((day) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "msd-chip",
							"aria-pressed": days.includes(day.id),
							onClick: () => {
								setField("peakDays", days.includes(day.id) ? days.filter((existing) => existing !== day.id) : [...days, day.id].sort());
							},
							children: t(day.key)
						}, day.id))
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "msd-actions",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "msd-primary",
						disabled: busy || effective === void 0,
						onClick: () => {
							setField("applyRequestedAt", Date.now());
						},
						children: t("action.applyNow")
					}), notice !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: notice.kind === "error" ? "msd-fail" : "msd-statusDim",
						children: notice.text
					}) : null]
				})
			] });
		}
		/** Route label helper shared with the status line (accepts any route-shaped value). */
		function routeLabelFrom(route, t) {
			return t("config.route", {
				provider: route.provider ?? "?",
				model: route.model ?? "?"
			});
		}
		//#endregion
		//#region src/client/ModelSchedulerButton.tsx
		/**
		* Composer trigger for the model-scheduler panel: a period badge (peak /
		* off-peak) next to the model seat. Clicking opens the portaled panel; the
		* panel content lives in ModelSchedulerPanel.
		*/
		/** Render the trigger and, while open, the anchored panel. */
		function ModelSchedulerButton({ t, ...injected }) {
			const [open, setOpen] = (0, react.useState)(false);
			const rootRef = (0, react.useRef)(null);
			const panelRef = (0, react.useRef)(null);
			const style = (0, _deepseek_ai_dsh_client_ui_primitives.useAnchoredPosition)({
				open,
				anchorRef: rootRef,
				panelRef,
				gap: 6,
				margin: 12
			});
			(0, _deepseek_ai_dsh_client_ui_primitives.useDismissOnOutsidePointer)(rootRef, open, setOpen, panelRef);
			const [now, setNow] = (0, react.useState)(() => /* @__PURE__ */ new Date());
			(0, react.useEffect)(() => {
				const timer = setInterval(() => {
					setNow(/* @__PURE__ */ new Date());
				}, 1e3);
				return () => {
					clearInterval(timer);
				};
			}, []);
			const period = periodAt(now, (0, react.useSyncExternalStore)(injected.scope.subscribe, injected.scope.getSnapshot).value ?? {});
			const periodLabel = period === "peak" ? t("period.peak") : t("period.offpeak");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: rootRef,
				className: "msd-root",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "msd-trigger",
					"aria-label": t("button.aria", { period: periodLabel }),
					title: t("button.tooltip"),
					onClick: () => {
						setOpen((open) => !open);
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: period === "peak" ? "msd-badge msd-badge-peak" : "msd-badge msd-badge-offpeak" }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: periodLabel }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {})
					]
				}), open ? (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					ref: panelRef,
					className: "msd-panel",
					style: style ?? void 0,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelSchedulerPanel, {
						injected,
						t,
						onClose: () => {
							setOpen(false);
						}
					})
				}), document.body) : null]
			});
		}
		//#endregion
		//#region src/client/styles.ts
		/**
		* Static stylesheet for the model-scheduler browser face.
		* Uses the Web client's design tokens (`--dsw-*`), injected once by apply.
		*/
		const cssText = `
.msd-root{position:relative;display:inline-flex}
.msd-trigger{min-height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:6px;align-items:center;gap:4px;padding:3px 2px;font-size:12px;line-height:18px;display:inline-flex}
.msd-trigger:hover,.msd-trigger:focus-visible{color:var(--dsw-alias-label-secondary)}
.msd-trigger svg{flex:none}
.msd-badge{width:8px;height:8px;border-radius:50%;flex:none}
.msd-badge-peak{background:var(--dsw-alias-state-warn-primary)}
.msd-badge-offpeak{background:var(--dsw-alias-label-tertiary)}
.msd-panel{z-index:100;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-menu);width:340px;max-width:min(340px,100vw - 32px);max-height:min(560px,100vh - 140px);box-shadow:var(--dsw-shadow-lv3);border-radius:12px;flex-direction:column;overflow:auto;position:fixed;display:flex}
.msd-panelHead{box-sizing:border-box;width:100%;flex:none;align-items:center;gap:8px;padding:10px 12px 6px;display:flex}
.msd-panelTitle{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:20px;flex:1;min-width:0}
.msd-close{cursor:pointer;color:var(--dsw-alias-label-tertiary);background:0 0;border:0;border-radius:6px;padding:2px;display:inline-flex}
.msd-close:hover{color:var(--dsw-alias-label-secondary)}
.msd-status{box-sizing:border-box;width:100%;flex:none;gap:5px;margin:4px 12px 2px;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-surface-tertiary);display:flex;flex-direction:column}
.msd-statusRow{color:var(--dsw-alias-label-secondary);align-items:center;gap:6px;font-size:12px;line-height:18px;display:flex;flex-wrap:wrap}
.msd-statusDim{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
.msd-section{box-sizing:border-box;width:100%;flex:none;gap:6px;padding:8px 12px;display:flex;flex-direction:column}
.msd-sectionTitle{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;font-weight:600;letter-spacing:.02em;text-transform:uppercase}
.msd-row{width:100%;align-items:center;gap:8px;display:flex}
.msd-rowLabel{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;width:86px;flex:none}
.msd-pick{cursor:pointer;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-surface-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;flex:1;min-width:0;align-items:center;gap:6px;padding:6px 10px;font-size:12px;line-height:18px;text-align:left;display:flex}
.msd-pick:hover:not(:disabled){border-color:var(--dsw-alias-border-l1)}
.msd-pick:disabled{cursor:default;color:var(--dsw-alias-label-tertiary)}
.msd-pickText{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.msd-pickChevron{color:var(--dsw-alias-label-tertiary);flex:none}
.msd-switchRow{align-items:center;gap:8px;padding:2px 0;display:flex}
.msd-switchLabel{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;flex:1}
.msd-windowRow{width:100%;align-items:center;gap:6px;display:flex}
.msd-windowLabel{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;width:52px;flex:none}
.msd-time{box-sizing:border-box;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-surface-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:5px 8px;font-size:12px;line-height:18px;font-family:inherit}
.msd-time:focus-visible{border-color:var(--dsw-alias-accent-primary);outline:0}
.msd-days{width:100%;flex-wrap:wrap;gap:6px;display:flex}
.msd-chip{cursor:pointer;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-surface-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:3px 10px;font-size:12px;line-height:18px}
.msd-chip:hover{border-color:var(--dsw-alias-border-l1)}
.msd-chip[aria-pressed=true]{color:var(--dsw-alias-label-on-accent);background:var(--dsw-alias-accent-primary);border-color:var(--dsw-alias-accent-primary)}
.msd-actions{box-sizing:border-box;width:100%;flex:none;gap:6px;padding:8px 12px 10px;display:flex;flex-direction:column}
.msd-primary{cursor:pointer;color:var(--dsw-alias-label-on-accent);background:var(--dsw-alias-accent-primary);border:0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;line-height:18px}
.msd-primary:hover:not(:disabled){filter:brightness(1.06)}
.msd-primary:disabled{cursor:default;opacity:.55}
.msd-searchRoot{box-sizing:border-box;width:100%;gap:6px;padding:8px 12px;display:flex;flex-direction:column;flex:1;min-height:0}
.msd-searchWrap{width:100%;position:relative;display:flex}
.msd-search{box-sizing:border-box;width:100%;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-surface-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:6px 10px;font-size:12px;line-height:18px;font-family:inherit}
.msd-search:focus-visible{border-color:var(--dsw-alias-accent-primary);outline:0}
.msd-list{flex:1;min-height:0;overflow-y:auto;gap:2px;display:flex;flex-direction:column}
.msd-groupTitle{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;font-weight:600;padding:6px 4px 2px}
.msd-model{box-sizing:border-box;width:100%;cursor:pointer;color:var(--dsw-alias-label-primary);background:0 0;border:0;border-radius:8px;align-items:center;gap:8px;padding:7px 10px;text-align:left;display:flex}
.msd-model:hover{background:var(--dsw-alias-surface-tertiary)}
.msd-modelName{font-size:12px;line-height:18px;flex:1;min-width:0}
.msd-modelDesc{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;flex:none;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.msd-modelTag{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:1px 7px;flex:none}
.msd-empty{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;text-align:center;padding:18px 8px}
.msd-hint{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
.msd-loading{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;text-align:center;padding:18px 8px}
.msd-fail{color:var(--dsw-alias-state-warn-label);font-size:12px;line-height:18px;padding:12px 8px;text-align:center}
`;
		/** Inject the stylesheet once; removes it on teardown. */
		function installStyles() {
			if (document.querySelector("style[data-plugin-css=\"dsh-model-scheduler\"]") !== null) return () => {};
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-scheduler";
			tag.dataset.pluginCss = "dsh-model-scheduler";
			tag.textContent = cssText;
			document.head.appendChild(tag);
			return () => {
				tag.remove();
			};
		}
		//#endregion
		//#region src/client/index.tsx
		/** Required client services. */
		const inject = [
			"slots",
			"locale",
			"settingsScope",
			"remote",
			"remote.session"
		];
		/**
		* Mount the model-scheduler UI.
		* @param ctx - the browser plugin context.
		*/
		function apply(ctx) {
			ctx.effect(() => installStyles(), "model-scheduler: styles");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "model-scheduler: dictionaries");
			const scope = ctx.settingsScope.bind({ namespace: "model-scheduler" });
			ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
				name: "conversation.input.right",
				id: "model-scheduler",
				order: 30,
				locale: NS,
				inject: (sessionId) => ({
					sessionId: String(sessionId),
					scope,
					loadCatalog: () => ctx.remote.session.modelCatalog().then((result) => {
						if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
						return result.value;
					}),
					selectModel: (route) => ctx.remote.session.selectModel({
						sessionId,
						provider: route.provider,
						model: route.model,
						...route.reasoningEffort === void 0 ? {} : { reasoningEffort: route.reasoningEffort }
					}).then((result) => {
						if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
					})
				})
			}, ModelSchedulerButton));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
