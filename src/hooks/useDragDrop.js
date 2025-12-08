import { useState, useCallback, useRef } from 'react';
import useStudioStore from '../context/StudioContext';
import { canAcceptDrop, createDragData } from '../panels/BasePanelInterface';
import { getPanelDefinition } from '../panels/registry';

/**
 * Custom hook for managing drag and drop between panels
 */
export function useDragDrop() {
  const { startDrag, setDropTarget, endDrag, dragSource, dragData, dropTarget } = useStudioStore();
  
  /**
   * Start dragging content from a panel
   */
  const handleDragStart = useCallback((e, contentType, data, sourcePanelId) => {
    const dragPayload = createDragData(contentType, data, sourcePanelId);
    
    // Set custom drag data
    e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
    e.dataTransfer.effectAllowed = 'copyMove';
    
    // Update store
    startDrag(sourcePanelId, dragPayload);
    
    // Add visual feedback
    e.target.classList.add('opacity-50');
  }, [startDrag]);
  
  /**
   * Handle drag over a potential drop target
   */
  const handleDragOver = useCallback((e, targetPanelId, targetPanelTypeId) => {
    e.preventDefault();
    
    const panelDef = getPanelDefinition(targetPanelTypeId);
    if (!panelDef?.dropZone) return;
    
    // Check if this panel can accept the current drag
    if (dragData && canAcceptDrop(panelDef.dropZone, dragData)) {
      e.dataTransfer.dropEffect = 'copy';
      setDropTarget(targetPanelId);
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  }, [dragData, setDropTarget]);
  
  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e, targetPanelId) => {
    if (dropTarget === targetPanelId) {
      setDropTarget(null);
    }
  }, [dropTarget, setDropTarget]);
  
  /**
   * Handle drop on a panel
   */
  const handleDrop = useCallback((e, targetPanelId, targetPanelTypeId, panelState, updateState) => {
    e.preventDefault();
    
    const panelDef = getPanelDefinition(targetPanelTypeId);
    if (!panelDef?.dropZone) return;
    
    // Get the drag data
    let data = dragData;
    if (!data) {
      try {
        data = JSON.parse(e.dataTransfer.getData('application/json'));
      } catch {
        return;
      }
    }
    
    // Verify we can accept this drop
    if (!canAcceptDrop(panelDef.dropZone, data)) {
      console.warn('Drop not accepted by target panel');
      endDrag();
      return;
    }
    
    // Execute the drop handler
    try {
      panelDef.dropZone.onDrop(data, panelState, updateState);
    } catch (err) {
      console.error('Error handling drop:', err);
    }
    
    endDrag();
  }, [dragData, endDrag]);
  
  /**
   * Handle drag end (cleanup)
   */
  const handleDragEnd = useCallback((e) => {
    e.target.classList.remove('opacity-50');
    endDrag();
  }, [endDrag]);
  
  return {
    // State
    isDragging: !!dragSource,
    dragSource,
    dragData,
    dropTarget,
    
    // Handlers
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}

/**
 * Hook for making a panel a drag source
 */
export function useDragSource(panelId) {
  const { handleDragStart, handleDragEnd, isDragging, dragSource } = useDragDrop();
  
  return {
    isDragging: dragSource === panelId,
    dragProps: {
      draggable: true,
      onDragStart: (e, contentType, data) => handleDragStart(e, contentType, data, panelId),
      onDragEnd: handleDragEnd,
    },
  };
}

/**
 * Hook for making a panel a drop target
 */
export function useDropTarget(panelId, panelTypeId, panelState, updateState) {
  const { handleDragOver, handleDragLeave, handleDrop, dropTarget, isDragging } = useDragDrop();
  
  return {
    isOver: dropTarget === panelId,
    canDrop: isDragging,
    dropProps: {
      onDragOver: (e) => handleDragOver(e, panelId, panelTypeId),
      onDragLeave: (e) => handleDragLeave(e, panelId),
      onDrop: (e) => handleDrop(e, panelId, panelTypeId, panelState, updateState),
    },
  };
}

export default useDragDrop;