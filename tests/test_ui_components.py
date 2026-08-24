"""
UI component system tests: rendering/behavior of the shared primitives in
templates/components/, not exact CSS class strings. See
docs/design/UI-DESIGN-SPEC.md for the documented component contracts.
"""
from django.template import Context, Template
from django.test import Client, TestCase, override_settings
from django.urls import reverse


def render(template_string, **context):
    return Template(template_string).render(Context(context))


class ButtonComponentTests(TestCase):
    def test_renders_button_element_by_default(self):
        html = render(
            '{% include "components/primitives/button.html" with label="Simpan" variant="primary" type="submit" %}'
        )
        self.assertIn("<button", html)
        self.assertIn('type="submit"', html)
        self.assertIn("btn-primary", html)
        self.assertIn("Simpan", html)

    def test_renders_anchor_when_href_given(self):
        html = render(
            '{% include "components/primitives/button.html" with label="Batal" variant="ghost" href="/schools/" %}'
        )
        self.assertIn("<a href=", html)
        self.assertIn('href="/schools/"', html)
        self.assertIn("btn-ghost", html)

    def test_disabled_anchor_has_no_navigable_href(self):
        html = render(
            '{% include "components/primitives/button.html" with label="Tambah" href="/schools/create/" disabled=True %}'
        )
        self.assertIn('href=""', html)
        self.assertIn('aria-disabled="true"', html)

    def test_size_modifier_applied(self):
        html = render(
            '{% include "components/primitives/button.html" with label="Sebelumnya" variant="ghost" size="sm" %}'
        )
        self.assertIn("btn-sm", html)


class SelectComponentTests(TestCase):
    def test_renders_options_with_hidden_input_for_form_submission(self):
        html = render(
            '{% include "components/primitives/select.html" with id="test-select" name="budget_year" '
            'options=options placeholder="Pilih" selected="2" %}',
            options=[{"value": "1", "label": "TA 2025/2026"}, {"value": "2", "label": "TA 2026/2027"}],
        )
        self.assertIn('name="budget_year"', html)
        self.assertIn('value="2"', html)
        self.assertIn("TA 2026/2027", html)
        self.assertIn('role="listbox"', html)
        self.assertIn('role="option"', html)

    def test_selected_option_marked_aria_selected(self):
        html = render(
            '{% include "components/primitives/select.html" with id="test-select" name="budget_year" '
            'options=options selected="2" %}',
            options=[{"value": "1", "label": "A"}, {"value": "2", "label": "B"}],
        )
        self.assertIn('data-value="2" aria-selected="true"', html)
        self.assertIn('data-value="1" aria-selected="false"', html)

    def test_no_selection_falls_back_to_placeholder_without_crashing(self):
        """
        A regression test for a real bug found while building this
        component: `{% if selected == opt.value %}`-style comparisons
        raise VariableDoesNotExist when `selected` is entirely absent
        from the include context (not just empty) -- unlike a plain
        `{{ selected }}` output, which fails silently. select.html must
        guard against this (see its `{% with sel=selected|default_if_none %}`).
        """
        html = render(
            '{% include "components/primitives/select.html" with id="test-select" name="branch" '
            'options=options placeholder="Semua Branch" %}',
            options=[{"value": "1", "label": "A"}],
        )
        self.assertIn("Semua Branch", html)

    def test_no_clear_omits_blank_option(self):
        html = render(
            '{% include "components/primitives/select.html" with id="test-select" name="budget_year" '
            'options=options selected="1" no_clear=True %}',
            options=[{"value": "1", "label": "A"}],
        )
        self.assertNotIn('data-value=""', html)

    def test_disabled_control_marks_trigger_disabled(self):
        html = render(
            '{% include "components/primitives/select.html" with id="test-select" name="x" '
            'options=options disabled=True %}',
            options=[{"value": "1", "label": "A"}],
        )
        self.assertIn("disabled", html)
        self.assertIn("is-disabled", html)


class MetricCardComponentTests(TestCase):
    def test_renders_label_and_value(self):
        html = render(
            '{% include "components/data/metric_card.html" with label="Total Sekolah" value=18 %}'
        )
        self.assertIn("Total Sekolah", html)
        self.assertIn(">18<", html)

    def test_title_tooltip_does_not_break_the_html_attribute(self):
        """
        Regression test: a title value containing a literal double-quote
        character (typed directly in a template's `with` clause, e.g.
        `title="Definisi \\"lengkap\\" ..."`) is NOT HTML-escaped by Django,
        because template string literals are treated as author-trusted and
        bypass autoescaping. An unescaped `"` inside the value breaks out of
        the surrounding `title="..."` HTML attribute. Callers must use
        `&quot;` entities directly in the literal instead of `\"` -- this
        test would fail loudly (extra stray `"` in the output) if that rule
        is violated again.
        """
        html = render(
            '{% include "components/data/metric_card.html" with label="X" value=1 '
            'title="Definisi &quot;lengkap&quot; belum ditentukan" %}'
        )
        self.assertIn('title="Definisi &quot;lengkap&quot; belum ditentukan"', html)
        # A broken attribute would leave a bare `"belum` outside the attribute value.
        self.assertNotIn('"belum', html)


class BadgeComponentTests(TestCase):
    def test_status_badge_tone_maps_to_semantic_classes(self):
        html = render('{% load monitoring_extras %}{% status_badge "Aktif" "success" %}')
        self.assertIn("Aktif", html)
        self.assertIn("text-success", html)

    def test_status_badge_default_tone_is_neutral(self):
        html = render('{% load monitoring_extras %}{% status_badge "Tidak Aktif" %}')
        self.assertIn("text-badge-neutral", html)

    def test_generic_badge_supports_info_tone(self):
        html = render('{% include "components/feedback/badge.html" with label="Baru" tone="info" %}')
        self.assertIn("text-info", html)
        self.assertIn("Baru", html)


class AlertComponentTests(TestCase):
    def test_danger_alert_has_alert_role(self):
        html = render(
            '{% include "components/feedback/alert.html" with tone="danger" message="Gagal." %}'
        )
        self.assertIn('role="alert"', html)
        self.assertIn("Gagal.", html)

    def test_success_alert_has_status_role(self):
        html = render(
            '{% include "components/feedback/alert.html" with tone="success" message="Berhasil." %}'
        )
        self.assertIn('role="status"', html)


class DropdownComponentTests(TestCase):
    def test_trigger_has_menu_semantics(self):
        html = render(
            '{% include "components/overlay/dropdown.html" with id="row-1" trigger_label="Aksi" items=items %}',
            items=[{"label": "Ubah", "url": "/schools/1/edit/"}],
        )
        self.assertIn('aria-haspopup="menu"', html)
        self.assertIn('aria-expanded="false"', html)
        self.assertIn('role="menu"', html)
        self.assertIn('role="menuitem"', html)
        self.assertIn("hidden", html)

    def test_post_item_includes_csrf_token(self):
        html = render(
            '{% include "components/overlay/dropdown.html" with id="row-1" items=items %}',
            items=[{"label": "Nonaktifkan", "url": "/schools/1/deactivate/", "post": True, "danger": True}],
        )
        self.assertIn("<form", html)
        self.assertIn("ui-dropdown-item-danger", html)


class DialogComponentTests(TestCase):
    def test_dialog_starts_hidden_with_dialog_role(self):
        html = render(
            '{% include "components/overlay/dialog.html" with id="d1" title="Judul" body="Isi." %}'
        )
        self.assertIn("hidden", html)
        self.assertIn('role="dialog"', html)
        self.assertIn('aria-modal="true"', html)
        self.assertIn("Judul", html)


class UIPreviewPageTests(TestCase):
    def test_returns_200_when_debug_true(self):
        with override_settings(DEBUG=True):
            response = Client().get(reverse("core:ui_preview"))
        self.assertEqual(response.status_code, 200)

    def test_returns_404_when_debug_false(self):
        with override_settings(DEBUG=False):
            response = Client().get(reverse("core:ui_preview"))
        self.assertEqual(response.status_code, 404)

    def test_does_not_require_authentication(self):
        """Static/example content only -- no real data, so no auth needed."""
        with override_settings(DEBUG=True):
            response = Client().get(reverse("core:ui_preview"))
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response.status_code, 302)


class SchoolFormComponentIntegrationTests(TestCase):
    """
    The School create/edit forms were migrated from {{ form.as_p }} to the
    FormField/Select component system -- these tests confirm the Django
    form's field names and validation are unaffected by that template
    change (see UI-DESIGN-SPEC.md section on Forms for why only these
    three simple forms were migrated).
    """

    def setUp(self):
        from apps.accounts.models import User
        from apps.branches.models import Branch

        self.branch = Branch.objects.create(code="UICOMP", name="UI Component Branch")
        self.central_user = User.objects.create_user(
            username="uicomp.central",
            name="UI Comp Central",
            password="a-strong-password",
            role=User.Role.CENTRAL,
        )

    def test_create_form_renders_branch_select_with_hidden_input(self):
        client = Client()
        client.login(username="uicomp.central", password="a-strong-password")
        response = client.get(reverse("schools:create"))
        self.assertContains(response, 'name="branch"')
        self.assertContains(response, f'data-value="{self.branch.pk}"')

    def test_create_form_still_validates_required_fields_server_side(self):
        client = Client()
        client.login(username="uicomp.central", password="a-strong-password")
        response = client.post(reverse("schools:create"), {"branch": "", "code": "", "name": ""})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "This field is required")
