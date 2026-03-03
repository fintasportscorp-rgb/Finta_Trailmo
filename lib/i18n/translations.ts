export type Locale = "en" | "fr"

export const translations = {
  // Header
  "header.subtitle": {
    en: "Motion Tracking Template",
    fr: "Modèle de Suivi de Mouvement",
  },

  // Skeleton viewer
  "skeleton.landmarks": { en: "landmarks", fr: "repères" },
  "skeleton.limitReached": { en: "Limit reached", fr: "Limite atteinte" },
  "skeleton.trail": { en: "Trail", fr: "Tracé" },

  // Landmark config panel
  "config.landmark": { en: "Landmark", fr: "Repère" },
  "config.trackerType": { en: "Tracker Type", fr: "Type de suivi" },
  "config.ring": { en: "Ring", fr: "Anneau" },
  "config.ringTrail": { en: "Ring + Trail", fr: "Anneau + Tracé" },
  "config.color": { en: "Color", fr: "Couleur" },
  "config.priority": { en: "Priority", fr: "Priorité" },
  "config.minimal": { en: "Minimal", fr: "Minimal" },
  "config.critical": { en: "Critical", fr: "Critique" },
  "config.feedbackNote": { en: "Feedback Note", fr: "Note de retour" },
  "config.notePlaceholder": {
    en: "Add coaching notes for this landmark...",
    fr: "Ajoutez des notes pour ce repère...",
  },
  "config.removeLandmark": { en: "Remove Landmark", fr: "Supprimer le repère" },
  "config.noSelection": { en: "No landmark selected", fr: "Aucun repère sélectionné" },
  "config.noSelectionHint": {
    en: "Click on a joint in the skeleton to configure its tracking parameters.",
    fr: "Cliquez sur une articulation du squelette pour configurer ses paramètres de suivi.",
  },
  "config.closePanel": { en: "Close panel", fr: "Fermer le panneau" },
  "config.setColor": { en: "Set color to", fr: "Définir la couleur à" },
  "config.configureLandmark": {
    en: "Configure Landmark",
    fr: "Configurer le repère",
  },
  "config.setTracking": {
    en: "Set tracking parameters for this landmark",
    fr: "Définir les paramètres de suivi pour ce repère",
  },

  // Template summary
  "summary.configured": { en: "Configured Landmarks", fr: "Repères configurés" },

  // Action bar
  "action.clearAll": { en: "Clear All", fr: "Tout effacer" },
  "action.clearTitle": { en: "Clear all landmarks?", fr: "Effacer tous les repères ?" },
  "action.clearDesc": {
    en: "This will remove all {count} configured landmark{s} from the template. This action cannot be undone.",
    fr: "Cela supprimera les {count} repère{s} configuré{s} du modèle. Cette action est irréversible.",
  },
  "action.cancel": { en: "Cancel", fr: "Annuler" },
  "action.cleared": { en: "All landmarks cleared", fr: "Tous les repères effacés" },
  "action.launchAnalysis": { en: "Launch Analysis", fr: "Lancer l'analyse" },

  // Video upload
  "upload.dropOrBrowse": {
    en: "Drop videos here or click to browse",
    fr: "Déposez des vidéos ici ou cliquez pour parcourir",
  },
  "upload.limitReached": { en: "Video limit reached", fr: "Limite de vidéos atteinte" },
  "upload.hint": {
    en: "MP4, MOV, WebM \u00B7 Max 100 MB \u00B7 Up to {max} videos",
    fr: "MP4, MOV, WebM \u00B7 Max 100 Mo \u00B7 Jusqu'à {max} vidéos",
  },
  "upload.recommendation": {
    en: "For best results: 60 fps, 1080p, full body visible, good lighting, under 30 seconds.",
    fr: "Pour de meilleurs résultats : 60 fps, 1080p, corps entier visible, bon éclairage, moins de 30 secondes.",
  },
  "upload.videos": { en: "Videos", fr: "Vidéos" },
  "upload.removeAll": { en: "Remove All", fr: "Tout supprimer" },
  "upload.maxError": {
    en: "Maximum {max} videos allowed",
    fr: "Maximum {max} vidéos autorisées",
  },
  "upload.rejected": { en: "Some files were rejected", fr: "Certains fichiers ont été rejetés" },
  "upload.onlyMore": {
    en: "Only {count} more video{s} can be added",
    fr: "Seulement {count} vidéo{s} supplémentaire{s} peuvent être ajoutée{s}",
  },
  "upload.done": { en: "Done", fr: "Terminé" },
  "upload.error": { en: "Error", fr: "Erreur" },
  "upload.lowVisibility": { en: "Low visibility", fr: "Faible visibilité" },

  // Analysis view
  "analysis.title": { en: "Video Analysis", fr: "Analyse vidéo" },
  "analysis.landmarksConfigured": {
    en: "{count} landmark{s} configured",
    fr: "{count} repère{s} configuré{s}",
  },
  "analysis.processing": { en: "Processing", fr: "Traitement" },
  "analysis.complete": { en: "Complete", fr: "Terminé" },
  "analysis.errorBadge": { en: "Error", fr: "Erreur" },
  "analysis.loadingModel": { en: "Loading pose model...", fr: "Chargement du modèle de pose..." },
  "analysis.analyzingVideos": {
    en: "Analyzing videos... {pct}%",
    fr: "Analyse des vidéos... {pct}%",
  },
  "analysis.videosDone": {
    en: "{done}/{total} videos done",
    fr: "{done}/{total} vidéos terminées",
  },
  "analysis.videosReady": {
    en: "{count} video{s} ready",
    fr: "{count} vidéo{s} prête{s}",
  },
  "analysis.cancelBtn": { en: "Cancel", fr: "Annuler" },
  "analysis.cancelled": { en: "Analysis cancelled", fr: "Analyse annulée" },
  "analysis.startAnalysis": { en: "Start Analysis", fr: "Démarrer l'analyse" },
  "analysis.reAnalyze": { en: "Re-analyze", fr: "Ré-analyser" },
  "analysis.backToTemplate": { en: "Back to template", fr: "Retour au modèle" },
  "analysis.completeToast": { en: "Analysis complete", fr: "Analyse terminée" },
  "analysis.completeDesc": {
    en: "Processed {count} video{s}.",
    fr: "{count} vidéo{s} traitée{s}.",
  },
  "analysis.failedToast": { en: "Analysis failed", fr: "Échec de l'analyse" },
  "analysis.failedDesc": { en: "An unexpected error occurred.", fr: "Une erreur inattendue s'est produite." },
  "analysis.lowVisWarn": {
    en: "Low pose visibility in \"{name}\"",
    fr: "Faible visibilité de la pose dans \"{name}\"",
  },
  "analysis.lowVisDesc": {
    en: "The body may not be fully visible. Results may be inaccurate.",
    fr: "Le corps n'est peut-être pas entièrement visible. Les résultats peuvent être imprécis.",
  },

  // Results
  "results.title": { en: "Results", fr: "Résultats" },
  "results.resolution": { en: "Resolution", fr: "Résolution" },
  "results.duration": { en: "Duration", fr: "Durée" },
  "results.frames": { en: "Frames", fr: "Images" },
  "results.detection": { en: "Detection", fr: "Détection" },
  "results.visibility": { en: "Visibility", fr: "Visibilité" },
  "results.fps": { en: "FPS", fr: "IPS" },
  "results.preview": { en: "Preview", fr: "Aperçu" },
  "results.downloadReady": { en: "Download ready", fr: "Téléchargement prêt" },
  "results.downloadVideo": { en: "Video", fr: "Vidéo" },
  "results.downloadPNG": { en: "Summary", fr: "Résumé" },
  "results.globalComment": { en: "Overall feedback", fr: "Commentaire global" },
  "results.globalCommentPlaceholder": {
    en: "Add overall coaching feedback for this motion analysis...",
    fr: "Ajoutez un retour global pour cette analyse de mouvement...",
  },

  // Export
  "export.title": { en: "Export Videos", fr: "Exporter les vidéos" },
  "export.annotated": { en: "Annotated Originals", fr: "Originaux annotés" },
  "export.annotatedDesc": {
    en: "Original videos with ring and trail overlays",
    fr: "Vidéos originales avec surcouches d'anneaux et de tracés",
  },
  "export.sequenced": { en: "Sequenced Video", fr: "Vidéo séquencée" },
  "export.sequencedDesc": {
    en: "Black background slides per landmark, ordered by priority",
    fr: "Diapositives sur fond noir par repère, ordonnées par priorité",
  },
  "export.generate": { en: "Generate Exports", fr: "Générer les exports" },
  "export.generating": { en: "Generating...", fr: "Génération en cours..." },
  "export.downloadAll": { en: "Download All (ZIP)", fr: "Tout télécharger (ZIP)" },
  "export.download": { en: "Download", fr: "Télécharger" },
  "export.progress": {
    en: "Generating... {pct}%",
    fr: "Génération... {pct}%",
  },
  "export.unsupported": {
    en: "Your browser does not support video encoding. Please use Chrome or Edge 94+.",
    fr: "Votre navigateur ne prend pas en charge l'encodage vidéo. Veuillez utiliser Chrome ou Edge 94+.",
  },
  "export.completeToast": { en: "Export complete", fr: "Export terminé" },
  "export.errorToast": { en: "Export failed", fr: "Échec de l'export" },

  // Priority labels
  "priority.1": { en: "Minimal", fr: "Minimal" },
  "priority.2": { en: "Low", fr: "Faible" },
  "priority.3": { en: "Medium", fr: "Moyen" },
  "priority.4": { en: "High", fr: "Élevé" },
  "priority.5": { en: "Critical", fr: "Critique" },

  // Color labels
  "color.red": { en: "Red", fr: "Rouge" },
  "color.orange": { en: "Orange", fr: "Orange" },
  "color.yellow": { en: "Yellow", fr: "Jaune" },
  "color.green": { en: "Green", fr: "Vert" },

  // Preview
  "preview.title": { en: "Video Preview", fr: "Aperçu vidéo" },
  "preview.close": { en: "Close preview", fr: "Fermer l'aperçu" },
} as const

export type TranslationKey = keyof typeof translations
