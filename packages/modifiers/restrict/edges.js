// This module adds the options.resize.restrictEdges setting which sets min and
// max for the top, left, bottom and right edges of the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictEdges: {
//     inner: { top: 200, left: 200, right: 400, bottom: 400 },
//     outer: { top:   0, left:   0, right: 600, bottom: 600 },
//   },
// });
import extend from '@interactjs/utils/extend';
import rectUtils from '@interactjs/utils/rect';
import restrict from './pointer';
const { getRestrictionRect } = restrict;
const noInner = { top: +Infinity, left: +Infinity, bottom: -Infinity, right: -Infinity };
const noOuter = { top: -Infinity, left: -Infinity, bottom: +Infinity, right: +Infinity };
function start({ interaction, state }) {
    const { options } = state;
    const startOffset = interaction.modifiers.startOffset;
    let offset;
    if (options) {
        const offsetRect = getRestrictionRect(options.offset, interaction, interaction.coords.start.page);
        offset = rectUtils.rectToXY(offsetRect);
    }
    offset = offset || { x: 0, y: 0 };
    state.offset = {
        top: offset.y + startOffset.top,
        left: offset.x + startOffset.left,
        bottom: offset.y - startOffset.bottom,
        right: offset.x - startOffset.right,
    };
}
function set({ coords, interaction, state }) {
    const { offset, options } = state;
    const edges = interaction.prepared._linkedEdges || interaction.prepared.edges;
    if (!edges) {
        return;
    }
    const page = extend({}, coords);
    const inner = getRestrictionRect(options.inner, interaction, page) || {};
    const outer = getRestrictionRect(options.outer, interaction, page) || {};
    fixRect(inner, noInner);
    fixRect(outer, noOuter);
    if (edges.top) {
        coords.y = Math.min(Math.max(outer.top + offset.top, page.y), inner.top + offset.top);
    }
    else if (edges.bottom) {
        coords.y = Math.max(Math.min(outer.bottom + offset.bottom, page.y), inner.bottom + offset.bottom);
    }
    if (edges.left) {
        coords.x = Math.min(Math.max(outer.left + offset.left, page.x), inner.left + offset.left);
    }
    else if (edges.right) {
        coords.x = Math.max(Math.min(outer.right + offset.right, page.x), inner.right + offset.right);
    }
}
function fixRect(rect, defaults) {
    for (const edge of ['top', 'left', 'bottom', 'right']) {
        if (!(edge in rect)) {
            rect[edge] = defaults[edge];
        }
    }
    return rect;
}
const restrictEdges = {
    noInner,
    noOuter,
    getRestrictionRect,
    start,
    set,
    defaults: {
        enabled: false,
        inner: null,
        outer: null,
        offset: null,
    },
};
export default restrictEdges;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlZGdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwrRUFBK0U7QUFDL0UsNkVBQTZFO0FBQzdFLEVBQUU7QUFDRiw0QkFBNEI7QUFDNUIsc0NBQXNDO0FBQ3RDLHFCQUFxQjtBQUNyQiwrREFBK0Q7QUFDL0QsK0RBQStEO0FBQy9ELE9BQU87QUFDUCxNQUFNO0FBR04sT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxTQUFTLE1BQU0sd0JBQXdCLENBQUE7QUFDOUMsT0FBTyxRQUFRLE1BQU0sV0FBVyxDQUFBO0FBRWhDLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxHQUFHLFFBQVEsQ0FBQTtBQUN2QyxNQUFNLE9BQU8sR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFBO0FBQ3hGLE1BQU0sT0FBTyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUE7QUFFeEYsU0FBUyxLQUFLLENBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUE0QztJQUM5RSxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFBO0lBQ3pCLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFBO0lBQ3JELElBQUksTUFBTSxDQUFBO0lBRVYsSUFBSSxPQUFPLEVBQUU7UUFDWCxNQUFNLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUVqRyxNQUFNLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtLQUN4QztJQUVELE1BQU0sR0FBRyxNQUFNLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQTtJQUVqQyxLQUFLLENBQUMsTUFBTSxHQUFHO1FBQ2IsR0FBRyxFQUFLLE1BQU0sQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLEdBQUc7UUFDbEMsSUFBSSxFQUFJLE1BQU0sQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLElBQUk7UUFDbkMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU07UUFDckMsS0FBSyxFQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLEtBQUs7S0FDckMsQ0FBQTtBQUNILENBQUM7QUFFRCxTQUFTLEdBQUcsQ0FBRSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUl6QztJQUNDLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFBO0lBQ2pDLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsWUFBWSxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFBO0lBRTdFLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDVixPQUFNO0tBQ1A7SUFFRCxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFBO0lBQy9CLE1BQU0sS0FBSyxHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUN4RSxNQUFNLEtBQUssR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7SUFFeEUsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUN2QixPQUFPLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBRXZCLElBQUksS0FBSyxDQUFDLEdBQUcsRUFBRTtRQUNiLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQU0sTUFBTSxDQUFDLEdBQUcsRUFBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsR0FBTSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDL0Y7U0FDSSxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7UUFDckIsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtLQUNsRztJQUNELElBQUksS0FBSyxDQUFDLElBQUksRUFBRTtRQUNkLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUssTUFBTSxDQUFDLElBQUksRUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksR0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDaEc7U0FDSSxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7UUFDcEIsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBSSxNQUFNLENBQUMsS0FBSyxFQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsS0FBSyxHQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtLQUNqRztBQUNILENBQUM7QUFFRCxTQUFTLE9BQU8sQ0FBRSxJQUFJLEVBQUUsUUFBUTtJQUM5QixLQUFLLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUU7UUFDckQsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFO1lBQ25CLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDNUI7S0FDRjtJQUVELE9BQU8sSUFBSSxDQUFBO0FBQ2IsQ0FBQztBQUVELE1BQU0sYUFBYSxHQUFHO0lBQ3BCLE9BQU87SUFDUCxPQUFPO0lBQ1Asa0JBQWtCO0lBQ2xCLEtBQUs7SUFDTCxHQUFHO0lBQ0gsUUFBUSxFQUFFO1FBQ1IsT0FBTyxFQUFFLEtBQUs7UUFDZCxLQUFLLEVBQUUsSUFBSTtRQUNYLEtBQUssRUFBRSxJQUFJO1FBQ1gsTUFBTSxFQUFFLElBQUk7S0FDYjtDQUNGLENBQUE7QUFFRCxlQUFlLGFBQWEsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRoaXMgbW9kdWxlIGFkZHMgdGhlIG9wdGlvbnMucmVzaXplLnJlc3RyaWN0RWRnZXMgc2V0dGluZyB3aGljaCBzZXRzIG1pbiBhbmRcbi8vIG1heCBmb3IgdGhlIHRvcCwgbGVmdCwgYm90dG9tIGFuZCByaWdodCBlZGdlcyBvZiB0aGUgdGFyZ2V0IGJlaW5nIHJlc2l6ZWQuXG4vL1xuLy8gaW50ZXJhY3QodGFyZ2V0KS5yZXNpemUoe1xuLy8gICBlZGdlczogeyB0b3A6IHRydWUsIGxlZnQ6IHRydWUgfSxcbi8vICAgcmVzdHJpY3RFZGdlczoge1xuLy8gICAgIGlubmVyOiB7IHRvcDogMjAwLCBsZWZ0OiAyMDAsIHJpZ2h0OiA0MDAsIGJvdHRvbTogNDAwIH0sXG4vLyAgICAgb3V0ZXI6IHsgdG9wOiAgIDAsIGxlZnQ6ICAgMCwgcmlnaHQ6IDYwMCwgYm90dG9tOiA2MDAgfSxcbi8vICAgfSxcbi8vIH0pO1xuXG5pbXBvcnQgSW50ZXJhY3Rpb24gZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbidcbmltcG9ydCBleHRlbmQgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZXh0ZW5kJ1xuaW1wb3J0IHJlY3RVdGlscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9yZWN0J1xuaW1wb3J0IHJlc3RyaWN0IGZyb20gJy4vcG9pbnRlcidcblxuY29uc3QgeyBnZXRSZXN0cmljdGlvblJlY3QgfSA9IHJlc3RyaWN0XG5jb25zdCBub0lubmVyID0geyB0b3A6ICtJbmZpbml0eSwgbGVmdDogK0luZmluaXR5LCBib3R0b206IC1JbmZpbml0eSwgcmlnaHQ6IC1JbmZpbml0eSB9XG5jb25zdCBub091dGVyID0geyB0b3A6IC1JbmZpbml0eSwgbGVmdDogLUluZmluaXR5LCBib3R0b206ICtJbmZpbml0eSwgcmlnaHQ6ICtJbmZpbml0eSB9XG5cbmZ1bmN0aW9uIHN0YXJ0ICh7IGludGVyYWN0aW9uLCBzdGF0ZSB9OiB7IGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbiwgc3RhdGU6IGFueSB9KSB7XG4gIGNvbnN0IHsgb3B0aW9ucyB9ID0gc3RhdGVcbiAgY29uc3Qgc3RhcnRPZmZzZXQgPSBpbnRlcmFjdGlvbi5tb2RpZmllcnMuc3RhcnRPZmZzZXRcbiAgbGV0IG9mZnNldFxuXG4gIGlmIChvcHRpb25zKSB7XG4gICAgY29uc3Qgb2Zmc2V0UmVjdCA9IGdldFJlc3RyaWN0aW9uUmVjdChvcHRpb25zLm9mZnNldCwgaW50ZXJhY3Rpb24sIGludGVyYWN0aW9uLmNvb3Jkcy5zdGFydC5wYWdlKVxuXG4gICAgb2Zmc2V0ID0gcmVjdFV0aWxzLnJlY3RUb1hZKG9mZnNldFJlY3QpXG4gIH1cblxuICBvZmZzZXQgPSBvZmZzZXQgfHwgeyB4OiAwLCB5OiAwIH1cblxuICBzdGF0ZS5vZmZzZXQgPSB7XG4gICAgdG9wOiAgICBvZmZzZXQueSArIHN0YXJ0T2Zmc2V0LnRvcCxcbiAgICBsZWZ0OiAgIG9mZnNldC54ICsgc3RhcnRPZmZzZXQubGVmdCxcbiAgICBib3R0b206IG9mZnNldC55IC0gc3RhcnRPZmZzZXQuYm90dG9tLFxuICAgIHJpZ2h0OiAgb2Zmc2V0LnggLSBzdGFydE9mZnNldC5yaWdodCxcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXQgKHsgY29vcmRzLCBpbnRlcmFjdGlvbiwgc3RhdGUgfToge1xuICBjb29yZHM6IEludGVyYWN0LlBvaW50LFxuICBpbnRlcmFjdGlvbjogSW50ZXJhY3Rpb24sXG4gIHN0YXRlOiBhbnlcbn0pIHtcbiAgY29uc3QgeyBvZmZzZXQsIG9wdGlvbnMgfSA9IHN0YXRlXG4gIGNvbnN0IGVkZ2VzID0gaW50ZXJhY3Rpb24ucHJlcGFyZWQuX2xpbmtlZEVkZ2VzIHx8IGludGVyYWN0aW9uLnByZXBhcmVkLmVkZ2VzXG5cbiAgaWYgKCFlZGdlcykge1xuICAgIHJldHVyblxuICB9XG5cbiAgY29uc3QgcGFnZSA9IGV4dGVuZCh7fSwgY29vcmRzKVxuICBjb25zdCBpbm5lciA9IGdldFJlc3RyaWN0aW9uUmVjdChvcHRpb25zLmlubmVyLCBpbnRlcmFjdGlvbiwgcGFnZSkgfHwge31cbiAgY29uc3Qgb3V0ZXIgPSBnZXRSZXN0cmljdGlvblJlY3Qob3B0aW9ucy5vdXRlciwgaW50ZXJhY3Rpb24sIHBhZ2UpIHx8IHt9XG5cbiAgZml4UmVjdChpbm5lciwgbm9Jbm5lcilcbiAgZml4UmVjdChvdXRlciwgbm9PdXRlcilcblxuICBpZiAoZWRnZXMudG9wKSB7XG4gICAgY29vcmRzLnkgPSBNYXRoLm1pbihNYXRoLm1heChvdXRlci50b3AgICAgKyBvZmZzZXQudG9wLCAgICBwYWdlLnkpLCBpbm5lci50b3AgICAgKyBvZmZzZXQudG9wKVxuICB9XG4gIGVsc2UgaWYgKGVkZ2VzLmJvdHRvbSkge1xuICAgIGNvb3Jkcy55ID0gTWF0aC5tYXgoTWF0aC5taW4ob3V0ZXIuYm90dG9tICsgb2Zmc2V0LmJvdHRvbSwgcGFnZS55KSwgaW5uZXIuYm90dG9tICsgb2Zmc2V0LmJvdHRvbSlcbiAgfVxuICBpZiAoZWRnZXMubGVmdCkge1xuICAgIGNvb3Jkcy54ID0gTWF0aC5taW4oTWF0aC5tYXgob3V0ZXIubGVmdCAgICsgb2Zmc2V0LmxlZnQsICAgcGFnZS54KSwgaW5uZXIubGVmdCAgICsgb2Zmc2V0LmxlZnQpXG4gIH1cbiAgZWxzZSBpZiAoZWRnZXMucmlnaHQpIHtcbiAgICBjb29yZHMueCA9IE1hdGgubWF4KE1hdGgubWluKG91dGVyLnJpZ2h0ICArIG9mZnNldC5yaWdodCwgIHBhZ2UueCksIGlubmVyLnJpZ2h0ICArIG9mZnNldC5yaWdodClcbiAgfVxufVxuXG5mdW5jdGlvbiBmaXhSZWN0IChyZWN0LCBkZWZhdWx0cykge1xuICBmb3IgKGNvbnN0IGVkZ2Ugb2YgWyd0b3AnLCAnbGVmdCcsICdib3R0b20nLCAncmlnaHQnXSkge1xuICAgIGlmICghKGVkZ2UgaW4gcmVjdCkpIHtcbiAgICAgIHJlY3RbZWRnZV0gPSBkZWZhdWx0c1tlZGdlXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZWN0XG59XG5cbmNvbnN0IHJlc3RyaWN0RWRnZXMgPSB7XG4gIG5vSW5uZXIsXG4gIG5vT3V0ZXIsXG4gIGdldFJlc3RyaWN0aW9uUmVjdCxcbiAgc3RhcnQsXG4gIHNldCxcbiAgZGVmYXVsdHM6IHtcbiAgICBlbmFibGVkOiBmYWxzZSxcbiAgICBpbm5lcjogbnVsbCxcbiAgICBvdXRlcjogbnVsbCxcbiAgICBvZmZzZXQ6IG51bGwsXG4gIH0sXG59XG5cbmV4cG9ydCBkZWZhdWx0IHJlc3RyaWN0RWRnZXNcbiJdfQ==